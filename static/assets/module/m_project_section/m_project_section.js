/**
 * Created by Wuwq on 2017/1/5.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_section",
        defaults = {
            postData: null,
            renderCallback: null,//渲染页面完成后事件
            renderListCompanyCallBack: null,//渲染项目范围
            query: {},//query.businessType（1：业务类型，2：研发类型）
            dataAction: 'myProjectList'//{myProjectList,projectOverview}
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._breadcrumb = null;
        this._currentCompanyId = window.currentCompanyId;
        this._currentCompanyUserId = window.currentCompanyUserId;
        this._headerList = null;
        this._listCompanyInfo = null;//视图组织
        this._dataList = [];


        this._cookiesMarkAction = 'myProjectList_' + (this.settings.query.businessType ? this.settings.query.businessType : 1);

        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            //筛选条件
            //渲染容器
            $(that.element).html(template('m_project_section/m_project_section', {
                businessType: that.settings.query.businessType
            }));
            if ($(that.element).find('#breadcrumb').length > 0)
                if (that.settings.query.businessType == 1) {
                    that._breadcrumb = [{name: '业务服务'}, {name: '业务类型'}];
                } else {
                    that._breadcrumb = [{name: '课题项目'}, {name: '研究组'}];
                }
            $(that.element).find('#breadcrumb').m_breadcrumb({dataList: that._breadcrumb}, true);

            that.getDepartList(function (data) {
                that._dataList = data;
                that.renderImages();
            })
        }
        ,getDepartList:function(callBack){
            var that = this;
            var option = {};
            option.url = that.settings.query.businessType==1?restApi.url_property_getBusinessPropertyList:restApi.url_org_listDepart;
            option.postData = {};
            option.postData.departType = that.settings.query.businessType;
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    var resopnseData= response.data;
                    if(callBack){
                        callBack(resopnseData);
                    }
                }else {
                    S_layer.error(response.info);
                }

            })
        }
        ,renderImages:function () {
            var that = this;

            $(document).off('mousemove.m_project_section_list');
            $(document).off('mouseup.m_project_section_list');

            if(that._isInitCubeportfolio === true)
                $('#cbp-projects').cubeportfolio('destroy');

            var html = template('m_project_section/m_project_section_list_item', {dataList:that._dataList,businessType:that.settings.query.businessType});
            $(that.element).find('#cbp-projects').html(html);

            $('#cbp-projects').cubeportfolio({
                layoutMode: 'grid',
                animationType: ' ',
                gapHorizontal: 72,
                gapVertical: 72,
                gridAdjustment: 'responsive',
                mediaQueries: [{
                    width: 768,
                    cols: 3
                },{
                    width: 320,
                    cols: 1
                }],
                caption: '',
                displayType: ' ',
                displayTypeSpeed: 100
            },function () {
                that._isInitCubeportfolio = true;
                //目前只有研究类型项目才允许进入课题介绍
                 that.bindImgClick();
                var t1 = setTimeout(function () {
                    clearTimeout(t1);
                },500);
            });

        },
        bindImgClick:function(){
            var that = this;
            $.each($(that.element).find('div[data-action="departAction"]'), function (i, o) {
                $(o).off('click.departAction').on('click.departAction', function () {
                    var departId = $(this).attr('data-key');
                    var departName = $(this).attr('data-value');
                /*    var option = {};
                    option.departId = departId;
                    option.departName = departName;
                    option.businessType = that.settings.query.businessType;
                    $(that.element).m_departIntroductionShow(option);*/
                     if(that.settings.query.businessType==1){
                        location.hash = '/projectSection/details?departId='+departId+'&departName='+ encodeURI(departName)+'&businessType='+that.settings.query.businessType;
                    }else {
                        location.hash = '/studyProjectSection/details?departId='+departId+'&departName='+ encodeURI(departName)+'&businessType='+that.settings.query.businessType;
                    }
                })
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
            } else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };


})(jQuery, window, document);
