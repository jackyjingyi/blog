/**
 * 组织－组织架构-编辑课题介绍 预览
 * Created by wrb on 2017/2/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_departSubjectShow",
        defaults = {
            projectId: null,//组织信息对象
            projectName: null,//组织信息对象
            businessType:null,
            departId:null,
            departName:null,
            styleType:'1',
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;
        this._currTreeObj = null;
        this._cdnUrl = window.cdnUrl;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.getTaskDetails(function (data) {
                that._leftExplainDesc = data.leftExplainDesc;
                that._styleType = data.styleType;
                that._renderHtml(data);
                that._bindBackTolast();
            })
        }
        ,getTaskDetails:function(callBack){
            var that = this;
            var option  = {};
            option.url = restApi.url_project_getTaskDetails;
            option.postData = {};
            option.postData.projectId = that.settings.projectId;
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
        //渲染界面
        , _renderHtml: function (data) {
            var that = this;
            var renderData = {
                leftExplainDesc:data.leftExplainDesc,
                editFlag:data.editFlag,
                styleType:data.styleType,
                data:data,
            };
            var html = template('m_project_section/m_departSubjectShow', renderData);
            $(that.element).html(html);
            var pageHeight = document.body.scrollHeight-144;
            var height =pageHeight + "px";
            $(that.element).find('.middleLine').css("height",height);

            if ($(that.element).find('#breadcrumb').length > 0){
                if (that.settings.businessType == 1) {
                    that._breadcrumb = [{name: '业务服务'}, {name: '业务类型'},{name: decodeURI(that.settings.departName)},{name: that.settings.projectName}];
                } else {
                    that._breadcrumb = [{name: '课题项目'},{ name:'研究组'},{name: decodeURI(that.settings.departName)},{name: that.settings.projectName}];
                }
                $(that.element).find('#breadcrumb').m_breadcrumb({dataList: that._breadcrumb}, true);
            }
        }


        //返回按钮绑定
        , _bindBackTolast: function () {
            var that = this;

            $(that.element).find("a[data-action='editIntroduction']").on('click', function () {
                that.editDepartSubject();
            });
            $(that.element).find("a[data-action='backToLast']").on('click', function () {
              that.gotoIntroduction();
            });

        }  ,editDepartSubject:function(){
            var option = {}, that = this;
            option.projectId = that.settings.projectId;
            option.departId = that.settings.departId;
            option.departName = that.settings.departName;
            option.businessType = that.settings.businessType;
            option.isEasyEdit = true;
            $(that.element).m_editDepartSubject(option);
        },gotoIntroduction:function () {
            var option = {}, that = this;
            option.projectId = that.settings.projectId;
            option.departId = that.settings.departId;
            option.departName = that.settings.departName;
            option.businessType = that.settings.businessType;
            $(that.element).m_departIntroductionShow(option);
        }


    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {

            //if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            //}
        });
    };

})(jQuery, window, document);
