/**
 * 添加项目模板管理
 * Created by wrb on 2019/11/20.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_task_temp_add",
        defaults = {
            doType:1,//1=编辑，2=查看
            taskTempData:null,//任务模板数据
            dataInfo:null
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        this._taskTempData = [];
        this._postParam = null;
        this._saveParam = null;

        this._fieldItems = [];
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_project_temp/m_project_task_temp_add', {
                doType:that.settings.doType,
                dataInfo:that.settings.dataInfo
            });
            $(that.element).html(html);
            that.renderTaskTempItem();
            that.bindActionClick();
            that.save_validate();

        }
        //渲染任务列表
        ,renderTaskTempItem:function (type) {
            var that = this;
            that.getDataInfo(type,function () {
                var html = template('m_project_temp/m_project_task_temp_add_list', {dataList:that._fieldItems});
                $(that.element).find('#taskTempItemList').html(html);
            });
        }
        ,getDataInfo:function (type,callBack) {
            var that = this;
            if(that.settings.dataInfo && that.settings.dataInfo.id && type==null){
                var option = {};
                option.classId = '#content-right';
                option.url = restApi.url_listTaskTemplateByMainId;
                option.postData = {
                    id:that.settings.dataInfo.id
                };
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        that._fieldItems = response.data;
                        if(callBack)
                            callBack();

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }else{
                if(callBack)
                    callBack();
            }

        }
        //请求数据
        ,save:function () {
            var that = this;

            var option = {};
            option.classId = that.element;
            option.url = restApi.url_saveTaskTemplate;
            option.postData =$(that.element).find('form').serializeObject();
            option.postData.fieldNameList = that._fieldItems;

            if(that.settings.dataInfo && that.settings.dataInfo.id)
                option.postData.id = that.settings.dataInfo.id;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    S_toastr.success('操作成功！');

                    $('body').m_production_process_set_range({
                        doType:2,
                        dataInfo:{
                            id:response.data
                        },
                        saveCallBack:function () {
                            $(that.element).m_project_task_temp({},true);
                        }
                    },true);


                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');

                switch (dataAction){
                    case 'selectTaskTemp':

                        if(that.settings.taskTempData==null || that.settings.taskTempData.length==0){
                            S_toastr.warning('没有任务模板，请先创建！');
                            return false;
                        }

                        $('body').m_project_task_temp_edit({
                            taskTempData:that.settings.taskTempData
                        });

                        break;

                    case 'addTaskTempItem'://编辑任务模板

                        $('body').m_project_task_temp_edit({
                            taskTempData:that.settings.taskTempData,
                            fieldItems:that._fieldItems,
                            saveCallBack:function (data) {
                                console.log(data);
                                that._fieldItems = data;
                                that.renderTaskTempItem(1);
                            }
                        });

                        break;

                    case 'save'://保存

                        if(that._fieldItems==null || that._fieldItems.length==0){
                            S_toastr.error('请添加任务模板！');
                            return false;
                        }
                        if($(that.element).find('form').valid()) {
                            that.save();
                        }else{
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                        }
                        break;
                    case 'cancel':
                        $(that.element).m_project_task_temp({},true);
                        break;

                }
                return false;
            });
        }
        //保存验证
        , save_validate: function () {
            var that = this;
            $(that.element).find('form').validate({
                rules: {
                    templateName: {
                        required: true,
                        maxlength:50
                    }
                },
                messages: {
                    templateName: {
                        required: '任务模版名称不能为空',
                        maxlength: '任务模版名称请控制在50字符内'
                    }
                },
                errorElement: "label",  //用来创建错误提示信息标签
                errorPlacement: function (error, element) {  //重新编辑error信息的显示位置
                    error.appendTo(element.closest('div'));
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