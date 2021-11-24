# Static data
from datetime import datetime

__all__ = ["BASE_SIDEBAR_INDEX", "INTERNAL", "TIME_INTERVAL", "STATUS_LIST", "PROCESS_TYPE", "PROJECT_TYPE",
           "PROJECT_RESEARCH_DIRECTION", "PROJECT_REQUIREMENT_VERBOSE"]

# Left side bar menu
BASE_SIDEBAR_INDEX = {
    "课题需求": {
        "general": [("课题录入", "project_creation"), ("我的课题", "my_projects"), ("所有课题", "display_all_projects"), ]
        # ("我的流程", "my_projects")],
    },
    "立项课题": {
        "general": [("我的立项课题", "annual_user_projects"), ("所有立项课题", "annual_all_projects"),
                    ],
    },
    "课题管理": {
        "general": [("创建流程", "project_settlement"), ("所有课题", "display_all_projects"),
                    ("所有立项课题", "annual_all_projects")]
    }
}

# internal cidr of iri
INTERNAL = '172.25.0.0/16'

# Main page search info <time>
TIME_INTERVAL = [
    ('30', '一个月'), ('90', '三个月'), ('180', '六个月'), (datetime.now().year, datetime.strftime(datetime.now(), '%Y年')),
    (datetime.now().year - 1, str(datetime.now().year - 1) + '年'),
    (datetime.now().year - 2, str(datetime.now().year - 2) + '年')
]

# Main page search info <status>
STATUS_LIST = [
    ("1", "申报中"), ("2", "待审批"), ("3", "已立项"), ("4", "已终止")
]

PROJECT_TYPE = [
    ('0', '未选择'), ('1', '前瞻战略研究'), ('2', '产品标准化研究'), ('3', '产品创新研究')   #前瞻战略研究
]
PROJECT_RESEARCH_DIRECTION = [
    ('2', '新型城镇化'), ('3', '文化&品牌'), ('4', '主题公园&新场景'), ('5', '新商业'), ('6', '产品管理'), ('7', '旅游大数据'),
    ('8', '康旅'), ('9', '创新投'), ('10', '其他')
]
PROJECT_REQUIREMENT_VERBOSE = {
    'project_name': '研究项目',
    "project_type": "课题类型",
    "project_research_direction": "研究方向",
    "project_department": "需求单位",
    "project_department_sponsor": "需求单位联系人",
    "project_department_phone": "联系电话",
    "project_co_group": "联合工作小组成员及分工",
    "project_research_funding": "研究经费",
    "project_outsourcing_funding": "外协预算",
    "project_start_time": "研究实施计划时间（起）",
    "project_end_time": "研究实施计划时间（止）",
    "project_detail": "具体分项任务内容及安排",
    "project_purpose": "主要创新研究课题内容、目标及意义",
    "project_preparation": "与课题相关的前期工作情况，现有基础条件",
    "project_difficult": "研究课题的重点及难点"
}

PROCESS_TYPE = [
    ('0', '未选择'), ('1', '课题录入'), ('2', '课题修改'), ('3', '进度录入'), ('4', '成果录入'), ('5', '结题'), ('6', '资料上传'),
    ('7', '立项')
]
