/**
 * 项目信息－添加签发任务
 * Created by wrb on 2018/10/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_issue_add",
        defaults = {
            isDialog:true,
            colspan:null,
            projectId:null,
            taskType:null,//1=添加子项，2=添加订单
            taskId:null,//任务ID
            timeInfo:null,//父任务时间
            cancelCallBack:null,//取消回调
            saveCallBack:null//回调函数
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID


        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_task_issue/m_task_issue_add', {
                appointmentStartTime:that.settings.timeInfo?that.settings.timeInfo.startTime:'',
                appointmentEndTime:that.settings.timeInfo?that.settings.timeInfo.endTime:'',
                projectTempData:that.settings.projectTempData,
                businessType:that.settings.businessType
            });

            if(!that.settings.isDialog)
                html = template('m_task_issue/m_task_issue_add_row', {
                    colspan:that.settings.colspan,
                    isSelectOrg:that.settings.isSelectOrg,
                    appointmentStartTime:that.settings.timeInfo?that.settings.timeInfo.startTime:'',
                    appointmentEndTime:that.settings.timeInfo?that.settings.timeInfo.endTime:'',
                    key:UUID.genV4().hexNoDelim
                });

            that.renderDialog(html,function () {
                that.initSelect2ByPersonInCharge();
                that.initSelect2ByOrderDeanId();
                that.bindActionClick();
                that.save_validate();
            });
        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑
                var   dialogTitle = '添加项目/子项';
                if(that.settings.businessType==2){
                    dialogTitle = '添加课题/子项';
                }
                S_layer.dialog({
                    title: that.settings.title||dialogTitle,
                    area : '750px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var flag = $(that.element).find('form').valid();
                        if (!flag || that.save()) {
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
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
                $(that.element).closest('table').find('tbody').append(html);
                that.element = $(that.element).closest('table').find('tbody tr:last');
                if(callBack)
                    callBack();
            }
        }
        //负责人
        ,initSelect2ByPersonInCharge:function () {
            var that = this;
            $(that.element).find('select[name="designerId"]').m_select2_by_search({
                type:2,
                isCookies:false,
                option:{
                    multiple:false,
                    //maximumSelectionLength:maximumSelectionLength,
                    //isClear:false,
                    containerCssClass:'',
                    url:restApi.url_listUserNoLeader,
                    params:{},
                    value:['']
                }},true);

            //$(that.element).find('select[name="personInCharge"]').val(window.currentCompanyUserId).trigger('change');
        }
        //分管院长
        ,initSelect2ByOrderDeanId:function () {
            var that = this;
            $(that.element).find('select[name="orderDeanId"]').m_select2_by_search({
                type:2,
                isCookies:false,
                option:{
                    multiple:false,
                    //maximumSelectionLength:maximumSelectionLength,
                    //isClear:false,
                    //placeholder:'请选择分管院长',
                    containerCssClass:'',
                    url:restApi.url_listProjectDean,
                    params:{},
                    value:['']
                }},true);

            //$(that.element).find('select[name="personInCharge"]').val(window.currentCompanyUserId).trigger('change');
        }
        //保存签发
        ,save:function (e) {
            var options={},that=this;

            var $form = $(that.element).find('form');
            if(e!=null)
                $form = $(e.target).closest('tr').find('form');

            options.classId = 'body';
            options.url=restApi.url_saveTaskIssuing;

            options.postData = $form.serializeObject();

            if(that.settings.taskType==2){

                options.url = restApi.url_saveOrderTask;
            }

            options.postData.projectId = that.settings.projectId;
            options.postData.taskType = that.settings.taskType || 2;

            if(isNullOrBlank(options.postData.companyId))
                options.postData.companyId = that._currentCompanyId;

            var $orgId = $form.find('input[name="orgId"]');
            if($orgId.length>0)
                options.postData.orgId = $orgId.attr('data-id');

            if(that.settings.taskId!=null)
                options.postData.taskPid = that.settings.taskId;


            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack(response.data,e);
                }else {
                    if(response.info.indexOf('已存在')>-1){
                        S_toastr.error(response.info);
                    }else{
                        S_layer.error(response.info);
                    }
                }
            });
        }
        //保存验证
        ,save_validate: function ($ele) {
            var that = this;
            var text = '项目/子项';
            if(that.settings.isDialog==false)
                text = '工作内容';

            if(isNullOrBlank($ele))
                $ele = $(that.element);

            $ele.find('form').validate({
                rules: {
                    taskName: {
                        required: true,
                        maxlength:50
                    },
                    year: {
                        required: true
                    },
                    orgId: {
                        required: true
                    },
                    orderDeanId: {
                        required: true
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
                        required: text+'名称不能为空',
                        maxlength: text+'名称请控制在50字符内'
                    },
                    year: {
                        required: '请选择所属年度'
                    },
                    orgId: {
                        required: '请选择团队'
                    },
                    orderDeanId: {
                        required: '请选择分管院长'
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
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('textarea[name="taskName"]').on('keyup',function () {//任务名称字数事件
                var len = $(this).val().length;
                $(this).parent().find('.wordCount').text(len);
                if(len>50){
                    $(this).parent().find('.wordCount').addClass('fc-red');
                }else{
                    if($(this).parent().find('.wordCount').hasClass('fc-red')){
                        $(this).parent().find('.wordCount').removeClass('fc-red');
                    }
                }
            });
            //绑定回车事件
            $(that.element).find('textarea[name="taskName"]').keydown(function(e) {
                if (event.keyCode == '13') {//keyCode=13是回车键
                    $(this).closest('tr').find('button[data-action="submit"]').click();
                    preventDefault(e);
                }
            });
            $(that.element).find('button[data-action="submit"]').on('click',function(e) {


                var $tr = $(this).closest('tr');
                var flag = $tr.find('form').valid(); //true;


                if(!flag){
                    S_toastr.error($(this).closest('tr').find('form label.error:visible').eq(0).text());
                    return false;
                }
                //创建验证订单不能重复
                if(that.settings.taskType==2){

                    var $panel = $tr.closest('.panel');
                    var $form = $tr.find('form');
                    var taskName = $form.find('textarea[name="taskName"]').val();

                    var existingTaskList = [];
                    if(taskName){
                        var isExist = $panel.find('tr[data-task-name="'+taskName+'"]').length;
                        if(isExist>0){
                            existingTaskList.push(taskName);
                        }
                    }
                    if(existingTaskList.length>0){
                        existingTaskList = existingTaskList.join(',');
                        S_toastr.error("“"+existingTaskList+'” 已存在，请重新输入！');
                        return false;
                    }

                }

                that.save(e);
                stopPropagation(e);
                return false;

            });
            $(that.element).find('button[data-action="cancel"]').on('click',function(e) {

                $(this).closest('tr').remove();
                if(that.settings.cancelCallBack)
                    that.settings.cancelCallBack();
                return false;
            });

            $(that.element).find('input[name="orgId"]').off('click').on('click',function () {
                var $this = $(this);
                $this.m_org_tree_select({
                    //treeData:data,
                    selectedCallBack:function (data) {
                        console.log(data);
                        $this.attr('data-id',data.id);
                        $this.val(data.text);
                    }
                });
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
