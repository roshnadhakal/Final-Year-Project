import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import Message, Chat, Patient, Doctor
from .serializers import MessageSerializer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if isinstance(self.user, AnonymousUser):
            await self.close()
            return

        # Get user type and ID from query parameters
        self.user_id = self.scope['query_string'].decode().split('=')[1]
        self.user_type = 'patient' if hasattr(self.user, 'patient_profile') else 'doctor'
        
        # Join room group for all chats this user is part of
        self.room_group_name = f'user_{self.user_id}'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')
        
        if message_type == 'chat_message':
            await self.handle_chat_message(text_data_json)
        elif message_type == 'read_messages':
            await self.handle_read_messages(text_data_json)

    async def handle_chat_message(self, data):
        message = data['message']
        chat_id = data['chat_id']
        
        # Save message to database
        new_message = await self.save_message(chat_id, message)
        
        if new_message:
            # Serialize the message
            serialized_message = await self.serialize_message(new_message)
            
            # Get the chat to find participants
            chat = await self.get_chat(chat_id)
            
            if chat:
                # Send to patient
                await self.channel_layer.group_send(
                    f"user_{chat.patient.id}",
                    {
                        'type': 'chat_message',
                        'message': serialized_message,
                        'chat_id': chat_id
                    }
                )
                
                # Send to doctor
                await self.channel_layer.group_send(
                    f"user_{chat.doctor.id}",
                    {
                        'type': 'chat_message',
                        'message': serialized_message,
                        'chat_id': chat_id
                    }
                )

    async def handle_read_messages(self, data):
        chat_id = data['chat_id']
        user_type = data['user_type']
        
        # Mark messages as read
        await self.mark_messages_as_read(chat_id, user_type)
        
        # Notify the other user that messages were read
        chat = await self.get_chat(chat_id)
        if chat:
            other_user_id = chat.patient.id if user_type == 'doctor' else chat.doctor.id
            await self.channel_layer.group_send(
                f"user_{other_user_id}",
                {
                    'type': 'messages_read',
                    'chat_id': chat_id,
                    'reader_type': user_type
                }
            )

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'chat_id': event['chat_id']
        }))

    async def messages_read(self, event):
        # Notify that messages were read
        await self.send(text_data=json.dumps({
            'type': 'messages_read',
            'chat_id': event['chat_id'],
            'reader_type': event['reader_type']
        }))

    @database_sync_to_async
    def save_message(self, chat_id, content):
        chat = Chat.objects.filter(id=chat_id).first()
        if not chat:
            return None

        if self.user_type == 'patient':
            sender_patient = Patient.objects.get(id=self.user_id)
            sender_doctor = None
        else:
            sender_doctor = Doctor.objects.get(id=self.user_id)
            sender_patient = None

        message = Message.objects.create(
            chat=chat,
            sender_patient=sender_patient,
            sender_doctor=sender_doctor,
            content=content
        )
        return message

    @database_sync_to_async
    def serialize_message(self, message):
        return MessageSerializer(message).data

    @database_sync_to_async
    def get_chat(self, chat_id):
        return Chat.objects.filter(id=chat_id).select_related('patient', 'doctor').first()

    @database_sync_to_async
    def mark_messages_as_read(self, chat_id, reader_type):
        if reader_type == 'patient':
            Message.objects.filter(chat_id=chat_id, sender_doctor__isnull=False, is_read=False).update(is_read=True)
        else:
            Message.objects.filter(chat_id=chat_id, sender_patient__isnull=False, is_read=True).update(is_read=True)