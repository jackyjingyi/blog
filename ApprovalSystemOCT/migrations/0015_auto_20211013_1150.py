# Generated by Django 3.2.6 on 2021-10-13 11:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ApprovalSystemOCT', '0014_projectrequirement'),
    ]

    operations = [
        migrations.AlterField(
            model_name='projectrequirement',
            name='project_research_direction',
            field=models.CharField(choices=[('0', '未选择'), ('1', '新型城镇化'), ('2', '文化&品牌'), ('3', '主题公园&新场景'), ('4', '新商业'), ('5', '产品管理'), ('6', '旅游大数据'), ('7', '康旅'), ('8', '创新投'), ('9', '其他')], default='0', help_text='0.未选择,1.新型城镇化；2.文化&品牌；3.主题公园&新场景；4.新商业；5.产品管理；6.旅游大数据；7.康旅；8.创新投；9.其他', max_length=25, verbose_name='研究方向'),
        ),
        migrations.AlterField(
            model_name='projectrequirement',
            name='project_type',
            field=models.CharField(choices=[('0', '未选择'), ('1', '创新前瞻性研究'), ('2', '产品标准化研究'), ('3', '产品创新研究')], default='0', help_text='0.未选择,1.创新前瞻性研究；2.产品标准化研究，3.产品创新研究', max_length=25, verbose_name='课题类型'),
        ),
    ]
