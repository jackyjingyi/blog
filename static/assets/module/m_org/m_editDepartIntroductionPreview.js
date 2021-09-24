/**
 * 组织－组织架构- 研究组简介 预览
 * Created by wrb on 2017/2/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_editDepartIntroductionPreview",
        defaults = {
            fileFullPath: null,//组织信息对象
            explainDesc: null,//组织信息对象
            departId: null,//组织信息对象
            projectList: []//组织信息对象
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
        this._fileFullPath = null;
        this._projectList = [];
        this._explainDesc = null;
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
              fileFullPath:that.settings.fileFullPath,
                projectList: that.settings.projectList,
                explainDesc:that.settings.explainDesc
            };
            var html = template('m_org/m_editDepartIntroductionPreview', renderData);
            $(that.element).html(html);
            var pageHeight = document.body.scrollHeight-144;
            var height =pageHeight + "px";
            $(that.element).find('.middleLine').css("height",height);
        }
        //返回按钮绑定
        , _bindBackTolast: function () {
            var option = {}, that = this;
            option.departId= that.settings.departId;
            option.fileFullPath=that.settings.fileFullPath;
            option.fileName=that.settings.fileName;
            option.fileId=that.settings.fileId;
            option.businessType= that.settings.businessType;
            option.projectList= that.settings.projectList;
            option.explainDesc=that.settings.explainDesc;
            option.isPreviewBack=true;
            $(that.element).find("a[data-action='backToLastDepartIntroduction']").on('click', function () {
                $(that.element).m_editDepartIntroduction(option);
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
