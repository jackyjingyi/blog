# Generated by Django 3.2.6 on 2022-01-04 17:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ApprovalSystemOCT', '0019_auto_20211221_1916'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='process',
            options={'permissions': (('packup_process', '合并流程'), ('dispatch_process', '分发流程'), ('approval_process', '审批权限'), ('view_submitted_process', '查看已提交课题需求'), ('view_unsubmitted_process', '查看未提交课题需求'), ('edit_process1', '编辑课题1'), ('delete_process1', '删除课题1'), ('submit_process1', '提交课题1'), ('edit_process2', '编辑课题2'), ('dispatch_process1', '分发课题'), ('delete_process2', '删除课题2'), ('edit_process3', '编辑课题3'), ('delete_process3', '删除课题3'), ('submit_process2', '提交课题2'), ('edit_process4', '编辑课题4'), ('add_process2', '创建课题2'), ('re_dispatch_process', '指派课题'), ('delete_process4', '删除课题4'), ('edit_process5', '编辑课题5'), ('submit_process3', '提交课题3'), ('deny_process', '驳回课题'), ('withdraw_process', '撤回课题'))},
        ),
        migrations.AlterField(
            model_name='projectrequirement',
            name='project_type',
            field=models.CharField(choices=[('0', '未选择'), ('1', '前瞻战略研究'), ('2', '产品管理究'), ('3', '产品创新研究')], default='0', help_text='0.未选择,1.创新前瞻性研究；2.产品标准化研究，3.产品创新研究', max_length=25, verbose_name='课题类型'),
        ),
    ]
