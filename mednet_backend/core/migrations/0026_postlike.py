# Generated by Django 5.2 on 2025-04-17 14:47

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0025_delete_postlike'),
    ]

    operations = [
        migrations.CreateModel(
            name='PostLike',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='likes', to='core.post')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.patient')),
            ],
            options={
                'unique_together': {('post', 'user')},
            },
        ),
    ]
