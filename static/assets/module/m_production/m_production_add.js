/**
 * 项目信息－添加生产安排
 * Created by wrb on 2018/10/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_add",
        defaults = {
            isDialog:true,
            colspan:null,
            projectId:null,
            taskId:null,//任务ID
            personInChargeInfo:null,//负责人信息
            timeInfo:null,//父任务时间
            taskOptionList:null,//快捷数据字典
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

        this._selectedOrgData = null;//选择的组织数据

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_production/m_production_add', {
                personInChargeInfo:that.settings.personInChargeInfo,
                appointmentStartTime:that.settings.timeInfo?that.settings.timeInfo.startTime:'',
                appointmentEndTime:that.settings.timeInfo?that.settings.timeInfo.endTime:'',
                taskId:that.settings.taskId,
                taskOptionList:that.settings.taskOptionList
            });

            if(!that.settings.isDialog){
                if(that.settings.childTask){
                    html = template('m_production/m_production_add_child_row', {
                        colspan:that.settings.colspan,
                        appointmentStartTime:that.settings.timeInfo?that.settings.timeInfo.startTime:'',
                        appointmentEndTime:that.settings.timeInfo?that.settings.timeInfo.endTime:'',
                        taskId:that.settings.taskId,
                    });
                }else{
                    html = template('m_production/m_production_add_row', {
                        colspan:that.settings.colspan,
                        personInChargeInfo:that.settings.personInChargeInfo,
                        appointmentStartTime:that.settings.timeInfo?that.settings.timeInfo.startTime:'',
                        appointmentEndTime:that.settings.timeInfo?that.settings.timeInfo.endTime:'',
                        taskId:that.settings.taskId,
                        taskOptionList:that.settings.taskOptionList
                    });
                }

            }


            that.renderDialog(html,function () {

                that.save_validate();
                that.bindActionClick();

                //外层浮窗展示，避免原浮窗导致panel出现横向滚动条
                if(!that.settings.isDialog){
                    $(that.element).find('button[data-toggle="dropdown"]').on('click',function () {
                        var $this = $(this);
                        var $html = $this.next().clone();
                        var content = $html.removeClass('hide').addClass('dp-block').prop('outerHTML');
                        $this.m_floating_popover({
                            content: content,
                            placement: 'bottomRight',
                            popoverStyle:{'border':'0','box-shadow':'none'},
                            isTargetPositionCenter:false,
                            //windowScrollClose:true,
                            renderedCallBack: function ($popover) {

                                $popover.find('a').on('click',function () {

                                    var name = $(this).text();
                                    $this.closest('.row-edit-item').find('input[name="taskName"]').val(name);

                                    $this.m_floating_popover('closePopover');//关闭浮窗
                                    return false;
                                });
                            }
                        }, true);
                    });

                }

            });
        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'添加生产安排',
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
                var $tr = $(that.element).closest('table').find('tr[data-id="'+that.settings.taskId+'"]');
                var $ptr = $(that.element).closest('table').find('tr[data-pid="'+that.settings.taskId+'"]:last');
                if($tr.length==0){
                    $(that.element).closest('table').find('tbody').append(html);
                    that.element = $(that.element).closest('table').find('tbody tr:last');
                }else if($ptr.length==0){
                    $tr.after(html);
                    that.element = $(that.element).closest('table').find('tr[data-pid="'+that.settings.taskId+'"]:last');
                }else{
                    $ptr.after(html);
                    that.element = $(that.element).closest('table').find('tr[data-pid="'+that.settings.taskId+'"]:last');
                }

                if(callBack)
                    callBack();
            }
        }
        //保存签发
        ,save:function (e) {
            var options={},that=this;
            var $form = $(that.element).find('form');
            if(e!=null)
                $form = $(e.target).closest('tr').find('form');

            options.url=restApi.url_saveTaskIssuing;

            options.postData =$form.serializeObject();
            options.postData.projectId = that.settings.projectId;
            options.postData.taskType =0;
            options.postData.companyId = that._currentCompanyId;
            options.postData.taskPid = that.settings.taskId;

            if(that.settings.childTask){
                options.postData.taskType = 6;
            }
            if(that.settings.handler){
                options.postData.handler = that.settings.handler;
            }
            //options.postData.designerId = $form.find('a[data-action="setTaskLeader"]').attr('data-id');
            options.postData.designUserList = [];
            options.postData.checkUserList = [];
            options.postData.examineUserList = [];

            /*if(that._designerListByAdd.length>0){
                $.each(that._designerListByAdd,function (index,item) {
                    options.postData.designUserList.push(item.id);
                });
            }
            if(that._checkUserListByAdd.length>0){
                $.each(that._checkUserListByAdd,function (index,item) {
                    options.postData.checkUserList.push(item.id);
                });
            }
            if(that._examineUserListByAdd.length>0){
                $.each(that._examineUserListByAdd,function (index,item) {
                    options.postData.examineUserList.push(item.id);
                });
            }*/
            if(that.settings.taskOptionList && that.settings.taskOptionList.length>0){
                $.each(that.settings.taskOptionList,function (i,item) {

                    if(options.postData.taskName == item.name){
                        options.postData.taskRelationId = item.id;
                        return false;
                    }
                })
            }


            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    S_toastr.success('添加成功！');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack(response.data,e);
                }else {
                    if(response.info.indexOf('已存在')>-1){
                        S_toastr.error(response.info);
                    }else{
                        S_layer.error(response.info);
                    }
                }
            })
        }
        //保存验证
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
                        required: '任务名称不能为空',
                        maxlength: '任务名称请控制在50字符内'
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

                //clone tr ,form表单验证失效处理
                var $tr = $(this).closest('tr');
                var flag = $tr.find('form').valid(); //true;
                var $panel = $tr.closest('.panel');
                var $form = $tr.find('form');
                var taskName = $form.find('textarea[name="taskName"]').val();

                if(!flag){
                    S_toastr.error($(this).closest('tr').find('form label.error:visible').eq(0).text());
                    return false;
                }
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
            $(that.element).find('a[data-action]').on('click',function (e) {//选择人员事件

                var dataAction = $(this).attr('data-action');
                switch (dataAction){
                    case "setTaskLeader"://设置任务负责人
                        that.choseTaskLeader($(this),0);
                        break;
                    case "setTaskDesigner"://设置设计人员

                        that.choseUser($(this),1);
                        break;
                    case "setTaskCheckUser"://设置校对人员
                        that.choseUser($(this),2);
                        break;
                    case "setTaskExamineUser"://设置审核人员
                        that.choseUser($(this),3);
                        break;
                }
                e.stopPropagation();
            });
            $(that.element).find('a[data-action="selectTaskOption"]').on('click',function () {
                var value = $.trim($(this).text());
                $(that.element).find('input[name="taskName"]').val(value);
                $(this).closest('.input-group-btn').removeClass('open');
            });
        }
        //选择任务负责人
        ,choseTaskLeader:function ($this,t) {
            var that = this;
            var personInChargeId = $this.attr('data-id'),userName=$this.attr('data-user-name');
            var options = {};
            options.selectedUserList = [{
                id:personInChargeId,
                userName:userName
            }];
            options.isASingleSelectUser = true;
            options.delSelectedUserCallback = function () {

            };
            options.title = '选择任务负责人';
            options.selectUserCallback = function (data,event) {

                var targetUser='<strong style="color:red;margin:0px 3px;">'+data.userName+'</strong>';
                var confirmTitle = '确定安排'+targetUser+'为新的任务负责人？';
                S_layer.confirm(confirmTitle,function(){

                    if(t==0){//添加情况下
                        $this.attr('data-id',data.companyUserId);
                        $this.attr('data-user-name',data.userName);
                        $this.prev().find('span').html(data.userName);
                        S_layer.close($(event));
                    }else{//编辑状态下
                        data.type = 1;
                        data.id = $this.attr('data-id');//旧任务负责人
                        data.taskId = $this.closest('tr').attr('data-id');
                        that.postManagerChange(data,event);
                    }
                },function(){
                    //S_layer.close($(event));
                });
            };
            $('body').m_orgByTree(options);
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
