/**
 * 生产流程
 * Created by wrb on 2019/11/4.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_process_nav",
        defaults = {
            type:1,//1=任务模板，2=图纸流程
            selectedCallBack:null,
            renderCallBack:null
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        this._projectTempData = {};

        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            var html = template('m_project_process/m_project_process_nav', {type:that.settings.type});
            $(that.element).html(html);
            that.renderProjectTypeSelect2(function () {

                if(that.settings.type==1){
                    that.renderChildSelect2(function () {

                        if(that.settings.renderCallBack)
                            that.settings.renderCallBack(that.getReturnData());
                    });
                }else{
                    if(that.settings.renderCallBack)
                        that.settings.renderCallBack(that.getReturnData());
                }

            });

        }
        //获取设计分类
        ,renderProjectTypeSelect2:function (callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_listProjectTemplate;
            option.postData = {};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._projectTypeList = response.data;

                    that.initSelect2($(that.element).find('select[name="projectType"]'),response.data);

                    if(callBack)
                        callBack();


                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染select2
        ,renderChildSelect2:function (callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_listProjectTemplateById;
            option.postData = {};

            var projectType = $(that.element).find('select[name="projectType"]').select2('data');
            if(projectType && projectType[0].dataId){
                option.postData.pid = projectType[0].dataId;
            }

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    that._projectTempData = response.data;

                    that.initSelect2($(that.element).find('select[name="stageDesign"]'),response.data.stageDesignList);

                    that.initSelect2($(that.element).find('select[name="majorDesign"]'),response.data.majorDesignList);

                    that.initSelect2($(that.element).find('select[name="functionType"]'),response.data.functionList);

                    if(that.settings.type==1)
                        that.renderSelect2ByFunctionTypeChild();

                    if(callBack)
                        callBack();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染select2
        ,initSelect2:function ($select,list,callBack) {
            var that = this;
            if($select==null)
                $select = $(that.element).find('select');

            if($select.next('.select2-container').length>0)
                $select.off('change').select2('destroy').empty();
            
            var data = [];

            data.push({id:'',text:'请选择'});
            if(list && list.length>0){
                $.each(list,function (i,item) {
                    data.push({id:item.relationId,text:item.fieldName,dataId:item.id});
                });
            }
            var selectOpt = {
                tags:false,
                allowClear: false,
                containerCssClass:'select-sm',
                minimumResultsForSearch: -1,
                language: "zh-CN",
                width:'100%',
                data:data
            };
            var $select2 = $select.select2(selectOpt);

            $select2.on('change', function (e) {

                var name = $(this).attr('name');
                if(name=='projectType'){

                    that.renderChildSelect2();

                }else if(name=='functionType'){

                    if(that.settings.type==1){
                        that.renderSelect2ByFunctionTypeChild();
                    }
                }

                if(that.settings.selectedCallBack)
                    that.settings.selectedCallBack(that.getReturnData());

            });

            if(callBack)
                callBack();
        }
        //渲染select2
        ,renderSelect2ByFunctionTypeChild:function () {

            var that = this;
            var $select = $(that.element).find('select[name="functionTypeChild"]');
            if($select.next('.select2-container').length>0)
                $select.off('change').select2('destroy').empty();


            var functionList =  that._projectTempData.functionList;
            var functionSelectedIndex = $(that.element).find('select[name="functionType"] option:selected').index()-1;
            var functionChildData = [];
            if(functionList[functionSelectedIndex]!=null)
                functionChildData = functionList[functionSelectedIndex].childList;

            that.initSelect2($(that.element).find('select[name="functionTypeChild"]'),functionChildData);


        }
        ,getReturnData:function () {
            var that = this;

            var data = $(that.element).find('form').serializeObject();

            var param = {};

            if(!isNullOrBlank(data.projectType))
                param.projectType = {relationId:data.projectType};

            if(!isNullOrBlank(data.functionType))
                param.functionType = {relationId:data.functionType};

            if(!isNullOrBlank(data.functionTypeChild))
                param.functionTypeChild = {relationId:data.functionTypeChild};

            if(!isNullOrBlank(data.stageDesign))
                param.stageDesign = {relationId:data.stageDesign};

            if(!isNullOrBlank(data.majorDesign))
                param.majorDesign = {relationId:data.majorDesign};

            return param;
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