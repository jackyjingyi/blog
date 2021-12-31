import json
import os, django
import sys
import json
import time

from django.test import TestCase
import requests
from alibabacloud_dingtalk.oauth2_1_0.client import Client as dingtalkoauth2_1_0Client
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_dingtalk.oauth2_1_0 import models as dingtalkoauth_2__1__0_models
from alibabacloud_tea_util.client import Client as UtilClient

from alibabacloud_dingtalk.todo_1_0.client import Client as dingtalktodo_1_0Client
from alibabacloud_dingtalk.todo_1_0 import models as dingtalktodo__1__0_models
from alibabacloud_tea_util import models as util_models
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_blog.settings')

application = get_wsgi_application()
django.setup()
from django.conf import settings

AK = settings.DING_TALK.get("ak")
SK = settings.DING_TALK.get("sk")
AGENTID = settings.DING_TALK.get("agentid")


def get_auth_token(ak, sk):
    config = open_api_models.Config()
    config.protocol = "https"
    config.region_id = "central"
    client = dingtalkoauth2_1_0Client(config)
    # 暂时同步
    get_access_token_request = dingtalkoauth_2__1__0_models.GetAccessTokenRequest(
        app_key=ak,
        app_secret=sk
    )

    try:
        return client.get_access_token(get_access_token_request)
    except Exception as err:
        if not UtilClient.empty(err.code) and not UtilClient.empty(err.message):
            # err 中含有 code 和 message 属性，可帮助开发定位问题
            pass


def get_userid(mobile, access_token):
    url = "https://oapi.dingtalk.com/topapi/v2/user/getbymobile"
    param = {
        "mobile": mobile
    }
    payload = {
        'access_token': access_token
    }
    # try:
    req = requests.post(url, data=json.dumps(param), params=payload)
    print(req.text)
    return json.loads(req.text)["result"]["userid"]
    # except Exception as e:
    #     print(e)


def get_user_info(userid, access_token):
    url = "https://oapi.dingtalk.com/topapi/v2/user/get"
    param = {
        "userid": userid
    }
    payload = {
        'access_token': access_token
    }

    req = requests.post(url, data=json.dumps(param), params=payload)
    res = json.loads(req.text)
    print(res)
    return (res['result']['unionid'], res['result']['name'])



class TodoDing:
    """
    钉钉待办
    """

    @staticmethod
    def create_client() -> dingtalktodo_1_0Client:
        """
        使用 Token 初始化账号Client
        @return: Client
        @throws Exception
        """
        config = open_api_models.Config()
        config.protocol = 'https'
        config.region_id = 'central'
        return dingtalktodo_1_0Client(config)

    @staticmethod
    def main(*args, **kwargs) -> None:

        access_token = args[0]
        client = TodoDing.create_client()
        create_todo_task_headers = dingtalktodo__1__0_models.CreateTodoTaskHeaders()
        create_todo_task_headers.x_acs_dingtalk_access_token = access_token
        notify_configs = dingtalktodo__1__0_models.CreateTodoTaskRequestNotifyConfigs(
            ding_notify='1'
        )
        detail_url = dingtalktodo__1__0_models.CreateTodoTaskRequestDetailUrl(
            app_url='https://www.dingtalk.com',
            pc_url='https://www.dingtalk.com'
        )
        create_todo_task_request = dingtalktodo__1__0_models.CreateTodoTaskRequest(
            **kwargs,
            notify_configs=notify_configs
        )
        try:

            client.create_todo_task_with_options(kwargs.get("creator_id"), create_todo_task_request,
                                                 create_todo_task_headers, util_models.RuntimeOptions())
        except Exception as err:
            if not UtilClient.empty(err.code) and not UtilClient.empty(err.message):
                # err 中含有 code 和 message 属性，可帮助开发定位问题
                pass

    @staticmethod
    async def main_async(*args, **kwargs) -> None:
        access_token = args[0]
        client = TodoDing.create_client()
        create_todo_task_headers = dingtalktodo__1__0_models.CreateTodoTaskHeaders()
        create_todo_task_headers.x_acs_dingtalk_access_token = access_token
        notify_configs = dingtalktodo__1__0_models.CreateTodoTaskRequestNotifyConfigs(
            ding_notify='1'
        )
        detail_url = dingtalktodo__1__0_models.CreateTodoTaskRequestDetailUrl(
            app_url='https://www.dingtalk.com',
            pc_url='https://www.dingtalk.com'
        )
        create_todo_task_request = dingtalktodo__1__0_models.CreateTodoTaskRequest(
            **kwargs,
            notify_configs=notify_configs
        )
        try:
            await client.create_todo_task_with_options_async(kwargs.get("creator_id"), create_todo_task_request,
                                                             create_todo_task_headers, util_models.RuntimeOptions())
        except Exception as err:
            if not UtilClient.empty(err.code) and not UtilClient.empty(err.message):
                # err 中含有 code 和 message 属性，可帮助开发定位问题
                pass


def generate_todo_inform_leader(**kwargs):
    res = {
        "subject": "立项审批申请",
        "creator_id": kwargs.get("creator_id"),
        "description": f"年度课题需求《{kwargs.get('project_name')}》已由{kwargs.get('creator_name')}提交年度立项。请及时登录 {kwargs.get('url')} 查看,备注： {kwargs.get('comments')}",
        # "due_time": kwargs.get('due_time'),
        "executor_ids": kwargs.get('executorIds'),
        "participant_ids": kwargs.get("participantIds"),
        "is_only_show_executor": False,
        "priority": kwargs.get("priority"),
    }
    return res


def generate_todo_approval_notice(**kwargs):
    res = {
        "subject": "审批申请反馈",
        "creator_id": kwargs.get("creator_id"),
        "description": f"年度课题需求《{kwargs.get('project_name')}》已由{kwargs.get('creator_name')}审批-{kwargs.get('move')}。请及时登录 {kwargs.get('url')} 查看审批结果, 备注: {kwargs.get('comments')}",
        # 通过 驳回 撤销
        # "due_time": kwargs.get('due_time'),
        "executor_ids": kwargs.get('executorIds'),
        "participant_ids": kwargs.get("participantIds"),
        "is_only_show_executor": False,
        "priority": kwargs.get("priority"),
    }
    return res


if __name__ == '__main__':
    res = get_auth_token(AK, SK).body.access_token
    print(res)
    user = get_userid('18835168547', res)
    user2 = get_userid("18826233694", res)
    user3 = get_userid("15627512840", res)
    print(user)
    user_info = get_user_info(user, res)
    user2_info = get_user_info(user2, res)
    user3_info = get_user_info(user3, res)
    print(user_info)

    pay = generate_todo_inform_leader(
        creator_id=user_info[0],
        creator_name=user_info[1],
        project_name="测试代办事项",
        url="http://bigdata.octiri.com/",
        executorIds=[user2_info[0], user3_info[0]],
        participantIds=[user2_info[0], user3_info[0]],
        priority=20,
        due_time=round(time.time() * 1000)
    )
    client = TodoDing()
    print(pay)
    client.main(res, **pay)
    # POST /v1.0/todo/users/{unionId}/tasks?operatorId=String HTTP/1.1
    # Host:api.dingtalk.com
    # x-acs-dingtalk-access-token:String
    # Content-Type:application/json
    #
    # {
    #   "sourceId" : "String",  不需要
    #   "subject" : "String",
    #   "creatorId" : "String",
    #   "description" : "String",
    #   "dueTime" : Long,
    #   "executorIds" : [ "String" ],
    #   "participantIds" : [ "String" ],
    #   "detailUrl" : {
    #     "appUrl" : "String",
    #     "pcUrl" : "String"
    #   },
    #   "isOnlyShowExecutor" : Boolean,
    #   "priority" : Integer,
    #   "notifyConfigs" : {
    #     "dingNotify" : "String"
    #   }
    # }
