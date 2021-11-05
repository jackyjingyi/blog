import logging
from datetime import datetime
import django.utils.timezone as timezone
from ApprovalSystemOCT.models import Task, Process, ProcessType


def processing_date_validator():
    query_set_not_start= ProcessType.objects.filter(status='2')

    try:
        for item in query_set_not_start:
            # start
            if item.process_start_time > timezone.now():
                logging.info(f"ProcessType {item.id} start processing")
                item.status = '1'
                item.save()
    except Exception as e:
        logging.warning(e)

    query_set_processing = ProcessType.objects.filter(status='1')
    try:
        for item in query_set_processing:
            # start
            if item.process_end_time < timezone.now():
                logging.info(f"ProcessType {item.id} end")
                item.status = '3'
                item.save()
    except Exception as e:
        logging.warning(e)

