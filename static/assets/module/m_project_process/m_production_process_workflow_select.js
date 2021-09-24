/**
 * 生产安排-流程设置-选择工作流
 * Created by wrb on 2019/6/14.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_process_workflow_select",
        defaults = {
            isDialog:true,
            projectId:null,
            processId:null,//流程ID
            processType:1,//1：生产任务:2：图纸:3：校审意见
            fromType:1,//1=默认生产安排入口，2=后台模板
            taskId:null,//任务ID
            saveParam:null,//保存请求多余参数
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID

        this._designProjectList = [];
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_project_process/m_production_process_workflow_select',{dataInfo:that.settings.dataInfo});
            that.renderDialog(html,function () {
                that.initSelect2();
                //that.save_validate();
            });
        },
        //初始化数据,生成html
        renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'添加状态',
                    area : '650px',
                    fixed:true,
                    //scrollbar:false,
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {
                        that.save();
                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack(layero,index,dialogEle);
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        //请求数据
        ,save:function () {
            var that = this;

            var option = {};
            option.url = restApi.url_copyProcess;
            option.postData = {};
            option.postData.processId = $(that.element).find('select[name="processId"]').val();
            option.postData.processName = $(that.element).find('select[name="processId"] option:selected').text();
            option.postData.processType = that.settings.processType;
            option.postData.projectId = that.settings.projectId;

            if(that.settings.saveParam)
                $.extend( option.postData, that.settings.saveParam);

            if(that.settings.taskId){
                option.url = restApi.url_saveProcessForProjectTask;
                option.postData.taskId = that.settings.taskId;
            }

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    S_toastr.success('操作成功！');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack(response.data);

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //表单验证
        ,save_validate:function(){
            var that = this;
            $(that.element).find('form').validate({
                rules: {
                    nodeValue: {
                        required: true
                    },
                    statusAlias: {
                        required: true,
                        maxlength: 28
                    }
                },
                messages: {
                    nodeValue: {
                        required: '请选择状态原名!'
                    },
                    statusAlias: {
                        required: '请输入状态别名!',
                        maxlength: '状态别名不超过28位!'
                    }
                },
                errorElement: "label",  //用来创建错误提示信息标签
                errorPlacement: function (error, element) {  //重新编辑error信息的显示位置
                    error.appendTo(element.closest('.col-sm-10'));
                }
            });
        }
        //视图切换
        ,initSelect2:function () {
            var that = this;

            var option = {};
            option.classId = that.element;
            option.url = restApi.url_listDesignProject;
            option.postData = {
                processType:that.settings.processType
            };

            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                    that._designProjectList = response.data;
                    var projectData = [],processData=[];
                    var processFun = function (processList) {
                        var list = [];
                        $.each(processList,function (i,item) {
                            list.push({
                                id: item.id,
                                text: item.processName
                            })
                        });
                        $(that.element).find('select[name="processId"]').select2({
                            tags:false,
                            allowClear: false,
                            //containerCssClass:'select-sm',
                            language: "zh-CN",
                            minimumResultsForSearch: -1,
                            data:list
                        });
                    };
                    $.each(response.data,function (i,item) {
                        projectData.push({
                            id: item.id,
                            text: item.name
                        });
                        if(i==0){
                           processFun(item.processList);
                        }
                    });

                    $(that.element).find('select[name="projectId"]').select2({
                        tags:false,
                        allowClear: false,
                        //containerCssClass:'select-sm',
                        language: "zh-CN",
                        minimumResultsForSearch: -1,
                        data:projectData
                    });

                    $(that.element).find('select[name="projectId"]').on("change", function (e) {

                        var id = $(this).val();
                        var dataItem = getObjectInArray(that._designProjectList,id);
                        $(that.element).find('select[name="processId"]').select2('destroy').empty();
                        processFun(dataItem.processList);
                    });


                }else {
                    S_layer.error(response.info);
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
