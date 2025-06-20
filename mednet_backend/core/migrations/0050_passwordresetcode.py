# Generated by Django 5.2 on 2025-05-03 07:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0049_alter_notification_recipient_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='PasswordResetCode',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user_type', models.CharField(choices=[('doctor', 'Doctor'), ('patient', 'Patient')], max_length=10)),
                ('user_id', models.IntegerField()),
                ('code', models.CharField(max_length=6)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
