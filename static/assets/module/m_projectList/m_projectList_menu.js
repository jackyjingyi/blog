/**
 * 我的项目-菜单
 * Created by wrb on 2018/1/5.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_projectList_menu",
        defaults = {
            dataAction:null,
            query:{}
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyUserId = window.currentCompanyUserId;
        this._breadcrumb = [];
        this._cookiesMark = 'cookiesData_lastComeInProjectList';
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.initHtmlData();
        }
        //初始化数据并加载模板
        ,initHtmlData:function () {
            var that = this;

            var html = template('m_projectList/m_projectList_menu',{
                viewAllProject:window.viewAllProject,
                businessType:that.settings.query.businessType
            });
            $(that.element).html(html);

            var dataAction = that.settings.dataAction;
            if(isNullOrBlank(dataAction))
                dataAction = $(that.element).find('ul.secondary-menu-ul li:first').attr('id');

            that.switchPage(dataAction);
        }
        //切换页面
        , switchPage: function (dataAction) {
            var that = this;
            var menuName = '课题项目';
            var secondMenuName = '项目总览';
            var thirdMenuName = '我的项目';
            var thirdMenuNameOverview = '项目总览';
            var activeDataAction = dataAction;

            if(window.viewAllProject==0){
                //没有项目总览权限
                dataAction = 'myProjectList';
            }

            switch (dataAction) {
                case 'myProjectList'://我的项目
                    that.myProjectList();
                    that._breadcrumb = [{name:menuName},{name:secondMenuName},{name:thirdMenuName}];
                    activeDataAction = 'myProjectList';
                    // if(that.settings.query.businessType==2){
                    //     activeDataAction = 'studyProjectList';//课题研究 我的项目
                    //     that.settings.query.activeDataAction = 'studyProjectList';
                    // }
                    break;
                case 'projectOverview'://项目总览
                    that.projectOverview();
                    that._breadcrumb = [{name:menuName},{name:secondMenuName},{name:thirdMenuNameOverview}];
                    activeDataAction = 'projectOverview';
                    // if(that.settings.query.businessType==2){
                    //     activeDataAction = 'studyProjectOverview';//课题研究 项目总览
                    // }
                    break;
            }
            $(that.element).find('ul.secondary-menu-ul li[id="'+activeDataAction+'"]').addClass('active').siblings().removeClass('active');
            $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
        }
        //我的项目
        , myProjectList: function () {
            var options = {}, that = this;
            options.dataAction = 'myProjectList';
            options.query = that.settings.query;
            $(that.element).find('#content-box').m_projectList(options, true);
        }
        //项目总览
        , projectOverview:function () {
            var options = {}, that = this;
            options.dataAction = 'projectOverview';
            options.query = that.settings.query;
            $(that.element).find('#content-box').m_projectList(options, true);
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
