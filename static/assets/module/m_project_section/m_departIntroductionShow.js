/**
 * 组织－组织架构- 研究组简介 预览
 * Created by wrb on 2017/2/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_departIntroductionShow",
        defaults = {
            departId: null,
            departName: null,
            businessType: null,
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
            that.getDepartInfo(function (data) {
                that._renderHtml(data);
                that._bindActionClick();
                that._bindBackTolast();
            })
        }
        , getDepartInfo: function (callBack) {
            var that = this;
            var option = {};
            option.url = that.settings.businessType==1?restApi.url_property_getCompanyPropertyById:restApi.url_getDepartDetailsInfo;
            option.postData = {};
            option.postData.id = that.settings.departId;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    var resopnseData = response.data;
                    if (callBack) {
                        callBack(resopnseData);
                    }
                } else {
                    S_layer.error(response.info);
                }

            })
        }
        //渲染界面
        , _renderHtml: function (data) {
            var that = this;
            var renderData = {
                fileFullPath: data.fileFullPath,
                projectList: data.projectList,
                explainDesc: data.explainDesc,
                businessType: that.settings.businessType,
            };
            var html = template('m_project_section/m_departIntroductionShow', renderData);
            $(that.element).html(html);

            var pageHeight = document.body.scrollHeight-144;
            var height =pageHeight + "px";
            $(that.element).find('.middleLine').css("height",height);

            if ($(that.element).find('#breadcrumb').length > 0){
                if (that.settings.businessType == 1)  {
                    that._breadcrumb = [{name: '业务服务'}, {name: '业务类型'}, {name: decodeURI(that.settings.departName)}];
                } else {
                    that._breadcrumb = [{name: '课题项目'},{ name:'研究组'}, {name: decodeURI(that.settings.departName)}];
                }

            $(that.element).find('#breadcrumb').m_breadcrumb({dataList: that._breadcrumb}, true);
            }

        }
        //按钮事件绑定
        , _bindActionClick: function () {
            var that = this;
            $.each($(that.element).find('a[data-action="projectAction"]'), function (i, o) {
                $(o).off('click.projectAction').on('click.projectAction', function () {
                    var projectId = $(this).attr('data-key');
                    var projectName = $(this).attr('data-value');
                    var option = {};
                    option.projectId = projectId;
                    option.projectName = projectName;
                    option.departId = that.settings.departId;
                    option.departName = that.settings.departName;
                    option.businessType = that.settings.businessType;
                    $(that.element).m_departSubjectShow(option);
                })
            });
        }
        //返回按钮绑定
        , _bindBackTolast: function () {
            var option = {}, that = this;
            $(that.element).find("a[data-action='backToLast']").on('click', function () {
/*                var query = {};
                 query.businessType = that.settings.businessType;
                $(that.element).m_project_section({query:query}, true);*/

                if(that.settings.businessType==1){
                    location.hash = '/projectSection?businessType='+that.settings.businessType;
                }else {
                    location.hash = '/studyProjectSection?businessType='+that.settings.businessType;
                }
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
