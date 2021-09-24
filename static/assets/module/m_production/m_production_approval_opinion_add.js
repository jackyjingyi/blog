/**
 * 项目信息－添加生产安排
 * Created by wrb on 2018/10/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_approval_opinion_add",
        defaults = {
            isDialog:true,
            projectId:null,
            taskId:null,//任务ID
            cancelCallBack:null,//取消回调
            beforeCallBack:null,//渲染前回调
            saveCallBack:null//回调函数
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID


        this.$_table = $(this.element).next().find('table');
        this.$_tr = null;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.render(function () {
                that.save_validate();
                that.bindActionClick();
            });
        }
        //渲染界面.
        ,render:function (callBack) {

            var that = this;
            var html = template('m_production/m_production_approval_opinion_add', {
                taskId:that.settings.taskId
            });

            if(that.$_table.find('tr.no-data').length>0)
                that.$_table.find('tr.no-data').hide();

            that.$_table.find('tbody tr:last').after(html);
            that.$_tr = that.$_table.find('tbody tr:last');
            if(callBack)
                callBack();

        }
        //保存校审意见
        ,save:function (e) {
            var options={},that=this;
            var $form = that.$_tr.find('form');

            options.url=restApi.url_saveApprovalOpinion;
            options.postData = $form.serializeObject();
            options.postData.projectId = that.settings.projectId;
            options.postData.companyId = that._currentCompanyId;
            options.postData.taskId = that.settings.taskId;

            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    S_toastr.success('添加成功！');
                    $(e.target).closest('tr').remove();
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
            that.$_tr.find('form').validate({
                rules: {
                    auditName: {
                        required: true,
                        maxlength:50
                    }
                },
                messages: {
                    auditName: {
                        required: '名称不能为空',
                        maxlength: '名称请控制在50字符内'
                    }
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
            //绑定回车事件
            that.$_tr.find('input[name="auditName"]').keydown(function(e) {
                if (event.keyCode == '13') {//keyCode=13是回车键
                    $(this).closest('tr').find('button[data-action="submit"]').click();
                    preventDefault(e);
                }
            });
            that.$_tr.find('button[data-action="submit"]').on('click',function(e) {

                //clone tr ,form表单验证失效处理
                var $tr = $(this).closest('tr'),$auditName = $tr.find('input[name="auditName"]');
                var flag = $tr.find('form').valid();
                if($.trim($auditName.val())==''){
                    flag = false;
                    if($auditName.parent().find('label.error').length==0)
                        $auditName.parent().append('<label id="auditName-error" class="error" for="auditName">设计任务名称不能为空</label>');

                    $auditName.on('focus blur',function () {
                        if($.trim($auditName.val())=='' && $auditName.parent().find('label.error').length==0){
                            $auditName.parent().append('<label id="auditName-error" class="error" for="auditName">设计任务名称不能为空</label>');
                        }else{
                            $auditName.parent().find('label.error').remove();
                        }
                    })
                }

                if(flag){
                    that.save(e);
                }else{
                    S_toastr.error($(this).closest('tr').find('form label.error:visible').eq(0).text());
                }
                stopPropagation(e);
                return false;

            });
            that.$_tr.find('button[data-action="cancel"]').on('click',function(e) {
                $(this).closest('tr').remove();

                if(that.$_table.find('tr').length==2 && that.$_table.find('tr.no-data').length>0)
                    that.$_table.find('tr.no-data').show();

                if(that.settings.cancelCallBack)
                    that.settings.cancelCallBack();

                return false;
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
