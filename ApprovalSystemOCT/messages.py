import json, django, os

import pika
from django.core.wsgi import get_wsgi_application

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_blog.settings')
#
# application = get_wsgi_application()
# django.setup()
# from django.conf import settings

"""
    settle topics
    groups: 
    a. administrator : 抄送
    b. approver
    c. requester
    c => publisher => exchange => queue => a,b,c(comsumers) 
"""


def _exchange_declare(channel, name,
                      exchange_type):
    channel.exchange_declare(exchange=name, exchange_type=exchange_type)
    return channel


def _channel(connection):
    return connection.channel()


def _connect():
    # common method used for class based workers
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(
            host="172.25.118.154"  # settings.RABBITMQ.get("host")
        )
    )
    return connection


class BaseMQ:
    def __init__(self):
        self.connection = _connect()
        self.channel = _channel(self.connection)

    def close(self):
        return self.connection.close()


class BaseNode(BaseMQ):
    # publish messages to queue
    exchange = ""
    exchange_type = ""


class ApprovalPublisher(BaseNode):
    exchange = "approval_message"
    exchange_type = "topic"

    def declare_exchange(self):
        return _exchange_declare(channel=self.channel, name=self.exchange, exchange_type=self.exchange_type)

    def publish(self, routing_key, message):
        self.channel.basic_publish(
            exchange=self.exchange, routing_key=routing_key, body=message, properties=pika.BasicProperties(
                delivery_mode=pika.spec.PERSISTENT_DELIVERY_MODE
            )
        )


class ApprovalReceiver(BaseNode):
    exchange = "approval_message"
    exchange_type = "topic"
    binding_keys = [
        "approval"
    ]

    def __init__(self):
        super().__init__()
        self.declare_exchange()
        # self.queue = self.set_queue(queue_name="approval")
        # self.queue_name = self.queue.method.queue

    def declare_exchange(self):
        return _exchange_declare(channel=self.channel, name=self.exchange, exchange_type=self.exchange_type)

    def set_queue(self, queue_name="", exclusive=True):
        return self.channel.q(queue_name, durable=True, exclusive=exclusive)

    def bind_queue(self):
        for binding_key in self.binding_keys:
            self.channel.queue_bind(
                exchange=self.exchange, queue="approval", routing_key=binding_key
            )

    def consume(self, callback, auto_ack=True):
        self.channel.basic_consume(
            queue="approval", on_message_callback=callback, auto_ack=auto_ack
        )
        self.channel.start_consuming()


if __name__ == '__main__':
    import time
    import _thread

    sender = ApprovalPublisher()
    sender.publish(
        routing_key="approval", message=u"{'id': '1', 'first_name': '杨景毅'}")
    sender.publish(
        routing_key="approval", message=u"{'id': '1', 'first_name': '杨景毅'}")
    sender.close()
    print(sender.channel)


    # sender.close()
    def callback(ch, method, properties, body):
        print(" [x] %r:%r" % (method.routing_key, body))


    re1 = ApprovalReceiver()
    re1.bind_queue()

    re1.consume(callback=callback, auto_ack=True)

    print("here")
