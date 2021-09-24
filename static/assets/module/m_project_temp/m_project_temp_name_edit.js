/**
 * 项目模板-添加、编辑
 * Created by wrb on 2019/9/3.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_temp_name_edit",
        defaults = {
            isDialog:true,
            dataInfo:null,//dataInfo不为null,即编辑
            pid:null,
            hadDataList:null,//已存在
            type: 1//（1：设计分类，2.阶段设置，3.专业设置，4.任务模板设置，5.专业信息）
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._title = '设计分类';

        if(this.settings.type==2){
            this._title = '阶段';
        }else if(this.settings.type==3){
            this._title = '专业';
        }else if(this.settings.type==4){
            this._title = '任务模板';
        }
        this.settings.title = '添加'+this._title;
        if(this.settings.dataInfo && this.settings.dataInfo.id)
            this.settings.title = '编辑'+this._title;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_project_temp/m_project_temp_name_edit', {
                dataInfo:that.settings.dataInfo,
                type:that.settings.type
            });
            that.renderDialog(html,function () {

                that.save_validate();
                if(that.settings.type==3){
                    that.initSelect2();
                }
            });

        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'添加设计分类',
                    area : ['650px'],
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var flag = $(that.element).find('form').valid();
                        if (!flag || that.save()) {
                            return false;
                        }
                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        //保存
        ,save:function () {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_saveProjectTemplate;
            option.postData = $(that.element).find("form").serializeObject();
            option.postData.type = that.settings.type;
            option.postData.pid = that.settings.pid;
            if(that.settings.dataInfo && that.settings.dataInfo.id)
                option.postData.id = that.settings.dataInfo.id;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack(option.postData);
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //表单验证
        ,save_validate:function(){
            var that = this;
            $(that.element).find('form.form-horizontal').validate({
                ignore : [],
                rules: {
                    fieldName:{
                        required: true,
                        isReName:true
                    }
                },
                messages: {
                    fieldName:{
                        required: that.settings.type==3?'请选择专业！':'请输入名称！',
                        isReName: '该项已存在！'
                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-sm-10'));
                }
            });
            $.validator.addMethod('isReName', function(value, element) {
                var isOk = true;
                if(that.settings.hadDataList && that.settings.hadDataList.length>0){
                    $.each(that.settings.hadDataList,function (i,item) {
                        if(item==$.trim(value)){
                            isOk = false;
                            return false;
                        }
                    })
                }
                return  isOk;
            }, '该项已存在！');
        }
        ,initSelect2:function () {
            var that = this;
            that.getMajorData(function (data) {

                $(that.element).find('select[name="fieldName"]').m_select2_by_search({
                    type:2,
                    isCookies:false,
                    option:{
                        data:data,
                        multiple:false,
                        isResultsText:false,
                        placeholder:'请选择专业'
                    }},true);
            });

        }
        //获取专业数据
        ,getMajorData:function (callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_getMajor;
            m_ajax.post(option, function (response) {
                if (response.code == '0') {

                    var data = [];
                    if(response.data){
                        $.each(response.data,function (i,item) {
                            data.push({id:item.name,text:item.name});
                        });
                    }
                    if(callBack)
                        callBack(data);

                } else {
                    S_layer.error(response.info);
                }
            })
        }
    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            // if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            // }
        });
    };

})(jQuery, window, document);
