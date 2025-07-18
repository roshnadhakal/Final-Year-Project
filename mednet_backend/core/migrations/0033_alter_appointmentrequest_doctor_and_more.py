# Generated by Django 5.2 on 2025-04-18 14:42

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0032_remove_post_user_post_user_content_type_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='appointmentrequest',
            name='doctor',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='doctor_requests', to='core.doctor'),
        ),
        migrations.AlterField(
            model_name='appointmentrequest',
            name='patient',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='patient_requests', to='core.patient'),
        ),
    ]
