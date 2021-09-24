/**
 * 组织－组织架构-编辑课题介绍 预览
 * Created by wrb on 2017/2/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_editDepartSubjectPreview",
        defaults = {
            projectId: null,//组织信息对象
            departId:null,
            leftExplainDesc:null,
            rightExplainDesc:null,
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
            that._renderHtml();
            that._bindBackTolast();
        }

        //渲染界面
        , _renderHtml: function () {
            var that = this;
            var renderData = {
                leftExplainDesc:that.settings.leftExplainDesc,
                data:that.settings.data,
                styleType:that.settings.styleType
            };
            var html = template('m_org/m_editDepartSubjectPreview', renderData);
            $(that.element).html(html);
            var pageHeight = document.body.scrollHeight-144;
            var height =pageHeight + "px";
            $(that.element).find('.middleLine').css("height",height);
        }


        //返回按钮绑定
        , _bindBackTolast: function () {
            var that = this;
            var option = {};
            option.projectId = that.settings.projectId;
            option.departId = that.settings.departId;
            option.businessType = that.settings.businessType;
            option.leftExplainDesc=that.settings.leftExplainDesc;
            option.data=that.settings.data;
            option.styleType=that.settings.styleType;
            option.isEasyEdit=that.settings.isEasyEdit;
            option.isPreviewBack=true;
            $(that.element).find("a[data-action='backToLast']").on('click', function () {
                $(that.element).m_editDepartSubject(option);
            });


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
