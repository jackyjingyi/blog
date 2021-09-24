/**
 * 项目信息－任务签发编辑
 * Created by wrb on 2018/10/25.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_issue_edit",
        defaults = {
            taskId:null,//任务ID
            dataInfo:null,//任务数据
            projectId:null,
            projectName:null,
            parentTask:null,
            t:null,//代表父级 t=0
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyUserId = window.currentCompanyUserId;//员工ID
        this._currentCompanyId = window.currentCompanyId;//组织ID
        this._currentUserId = window.currentUserId;//用户ID
        this._fastdfsUrl = window.fastdfsUrl;//文件地址

        this._dataInfo = {};//请求签发数据

        this._title = this.settings.t==0?'设计任务':'任务订单';
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            that.renderPage();
        },
        //渲染初始界面
        renderPage:function () {
            var that = this;
            var html = template('m_task_issue/m_task_issue_edit',{
                dataInfo:that.settings.dataInfo,
                projectId:that.settings.projectId,
                projectNameCode:encodeURI(that.settings.projectName),
                title:that._title,
                appointmentStartTime:that.settings.parentTask?that.settings.parentTask.startTime:'',
                appointmentEndTime:that.settings.parentTask?that.settings.parentTask.endTime:''
            });
            $(that.element).html(html);

            $(that.element).find('#remarkEditor').m_text_editor({
                isVideo:false,
                placeholder:that.settings.t==0?'请输入项目/子项描述':'请输入订单描述',
                onInit:function () {
                    $(that.element).find('#remarkEditor .summernote').summernote('code', that.settings.dataInfo.taskRemark);
                }
            },true);
            that.bindActionClick();
            //that.save_validate();
        }
        //编辑签发保存
        ,saveTaskIssue:function () {
            var options={},that=this;
            options.classId = that.element;
            options.url=restApi.url_updateProjectBaseData;
            options.postData = $(that.element).find('form.m-task-issue-edit').serializeObject();
            options.postData.projectId = that.settings.projectId;
            //options.postData.taskType = 2;
            options.postData.id = that.settings.dataInfo.id;
            options.postData.taskRemark =  $(that.element).find('#remarkEditor .summernote').summernote('code');
            options.postData.isUpdateDate = 1;

            m_ajax.postJson(options,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();
                }else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action],button[data-action]').off('click').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');
                switch (dataAction){

                    case 'cancel'://取消
                        $('#content-right').m_task_issue_details({
                            projectId : that.settings.projectId,
                            projectName : that.settings.projectName,
                            taskId : that.settings.dataInfo.id
                        },true);
                        return false;
                        break;
                    case 'submit'://提交

                        //var flag = $(that.element).find('form').valid();
                        //summernote跟validate插件冲突
                        if(that.save_validate_custom()){
                            that.saveTaskIssue();
                        }else{
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                        }
                        return false;
                        break;
                }
            });
        }
        //保存验证
        , save_validate_custom:function () {
            var that = this;
            var flag = true;//$(that.element).find('form').valid();//summernote跟validate插件冲突
            var $taskName = $(that.element).find('input[name="taskName"]');
            var $startTime = $(that.element).find('input[name="startTime"]');
            var $endTime = $(that.element).find('input[name="endTime"]');

            var errorMsg = function ($ele,t) {
                var text = '',isError = false,value = $.trim($ele.val());
                switch(t){
                    case 1:
                        text = that._title+'名称不能为空';
                        if(value=='')
                            isError = true;
                        break;
                    case 2:
                        text = that._title+'名称请控制在50字符内';
                        if(value.length>50)
                            isError = true;
                        break;
                    case 3:
                        text = '请设置开始日期';
                        if(value=='')
                            isError = true;
                        break;
                    case 4:
                        text = '请设置结束日期';
                        if(value=='')
                            isError = true;
                        break;
                }

                if(isError){

                    if($ele.parents('.row-edit-item').find('label.error').length==0)
                        $ele.parents('.row-edit-item').append('<label class="error">'+text+'</label>');

                    $ele.on('focus blur',function () {
                        if(($ele.val()=='' && $ele.parents('.row-edit-item').find('label.error').length==0)
                            || (t==2 && $.trim($ele.val()).length>50 && $ele.parents('.row-edit-item').find('label.error').length==0)){

                            $ele.parents('.row-edit-item').append('<label class="error">'+text+'</label>');

                        }else{

                            $ele.parents('.row-edit-item').find('label.error').remove();
                        }
                    });
                }
                return isError;
            };

            if(errorMsg($taskName,1) | errorMsg($taskName,2))
                flag = false;

            return flag;
        }
        , save_validate: function () {
            var that = this;
            $(that.element).find('form').validate({
                rules: {
                    taskName: {
                        required: true,
                        maxlength:50
                    }
                    /*,startTime: {
                        required: true
                    }
                    ,endTime: {
                        required: true
                    }*/
                },
                messages: {
                    taskName: {
                        required: '设计不能为空',
                        maxlength: '设计任务名称请控制在50字符内'
                    }
                    /*,startTime: {
                        required: '请设置开始日期'
                    }
                    ,endTime: {
                        required: '请设置结束日期'
                    }*/


                },
                errorElement: "label",  //用来创建错误提示信息标签
                errorPlacement: function (error, element) {  //重新编辑error信息的显示位置
                    if(element.closest('.row-edit-item').length>0){
                        error.appendTo(element.closest('.row-edit-item'));
                    }else{
                        error.appendTo(element.closest('.col-sm-10'));
                    }

                }
            });
        }
    });

    /*
     1.一般初始化（缓存单例）： $('#id').pluginName(initOptions);
     2.强制初始化（无视缓存）： $('#id').pluginName(initOptions,true);
     3.调用方法： $('#id').pluginName('methodName',args);
     */
    $.fn[pluginName] = function (options, args) {
        var instance;
        var funcResult;
        var jqObj = this.each(function () {

            //从缓存获取实例
            instance = $.data(this, "plugin_" + pluginName);

            if (options === undefined || options === null || typeof options === "object") {

                var opts = $.extend(true, {}, defaults, options);

                //options作为初始化参数，若args===true则强制重新初始化，否则根据缓存判断是否需要初始化
                if (args === true) {
                    instance = new Plugin(this, opts);
                } else {
                    if (instance === undefined || instance === null)
                        instance = new Plugin(this, opts);
                }

                //写入缓存
                $.data(this, "plugin_" + pluginName, instance);
            }
            else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };

})(jQuery, window, document);
