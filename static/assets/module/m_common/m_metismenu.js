/**
 * 工作台菜单
 * Created by wrb on 2017/10/11.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_metismenu",
        defaults = {
            contentEle:null,//
            projectId:null,
            projectName:null,
            type:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyUserId = window.currentCompanyUserId;
        this._cookiesMark = 'cookiesData_metismenu';
        this._token = '';
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            that.initHtmlTemplate();
        }
        ,initHtmlTemplate:function () {
            var that = this;
            var isMiniNav = false;

            var html = template('m_common/m_metismenu',{companyVersion:window.companyVersion,viewAllProject:window.viewAllProject});
            $(that.element).html(html);

            rolesControl();
            that.menuClickFun();
            that.removeNoMenuUl();
            that.bindActionClick();

            var cookiesData = getProjectParamCookies(that._cookiesMark,that._currentCompanyUserId);
            if(!isNullOrBlank(cookiesData)){
                if(cookiesData.param.isMiniNav)
                    $('body').toggleClass('mini-navbar');
            }
            // Minimalize menu
            $('.navbar-minimalize a.workbench').on('click', function () {

                $('body').toggleClass('mini-navbar');
                var $cookiesData = {id:that._currentCompanyUserId};
                if($('body').hasClass('mini-navbar')){
                    $cookiesData.param = {isMiniNav:true};
                }else{
                    $cookiesData.param = {isMiniNav:false};
                }
                //Cookies.set(that._cookiesMark, $cookiesData);
                setProjectParamCookies(that._cookiesMark,$cookiesData,that._currentCompanyUserId);
                that.smoothlyMenu();
            });
        }
        ,smoothlyMenu:function() {
            if (!$('body').hasClass('mini-navbar') || $('body').hasClass('body-small')) {
                // Hide menu in order to smoothly turn on when maximize menu
                $('#side-menu').hide();
                // For smoothly turn on menu
                setTimeout(
                    function () {
                        $('#side-menu').fadeIn(400);
                    }, 200);
            } else if ($('body').hasClass('fixed-sidebar')) {
                $('#side-menu').hide();
                setTimeout(
                    function () {
                        $('#side-menu').fadeIn(400);
                    }, 100);
            } else {
                // Remove all inline style from jquery fadeIn function to reset menu state
                $('#side-menu').removeAttr('style');
            }
        }
        //菜单点击事件
        ,menuClickFun:function () {
            var that = this;
            $(that.element).find('.metismenu li:not(.navbar-minimalize) a').on('click',function () {

                var $this = $(this);
                var id = $this.attr('id');

                if($this.parent().find('ul').length>0 && !$this.parent().hasClass('liStudyProjectList') &&!$this.parent().hasClass('liProjectList')){
                    $this.parent().toggleClass('selected');
                    $this.parent().find('ul').toggleClass('in');

                }else{

                    $this.parent().toggleClass('active').siblings().removeClass('active selected').find('li').removeClass('active selected');
                    $this.parent().siblings().find('ul').removeClass('in');

                    if($this.parents('.nav-third-level').length>0){
                        $this.parents('.selected').siblings().removeClass('active selected').find('li').removeClass('active selected');
                        $this.parents('.selected').siblings().find('ul').removeClass('in');

                        console('aaa');

                    }

                /*    if($(that.element).find('.liStudyProjectList ul').length>0){
                        $(that.element).find('.liStudyProjectList ul').remove();//清除最近浏览的项目详情
                    }
                    if($(that.element).find('.liProjectList ul').length>0){
                        $(that.element).find('.liProjectList ul').remove();//清除最近浏览的项目详情
                    }*/
                }
            });
        }
        //只针对一级菜单
        ,menuDealFun:function (dataAction) {
            var that = this;
            if(dataAction.indexOf('/project/')>-1){//当前是项目详情

                dataAction = dataAction.replaceAll('/project/','');

            }else{

                //清除最近浏览的项目详情
                if($(that.element).find('.liStudyProjectList ul').length>0){
                    $(that.element).find('.liStudyProjectList').removeClass('selected').find('ul').remove();
                }
                if($(that.element).find('.liProjectList ul').length>0){
                    $(that.element).find('.liProjectList').removeClass('selected').find('ul').remove();
                }
            }
            if(dataAction.indexOf('/')==0)
                dataAction = dataAction.substring(1,dataAction.length);

            if(dataAction.indexOf('/')>-1)
                dataAction = dataAction.substring(0,dataAction.indexOf('/'));



            if( dataAction=='studyProjectList'|| dataAction=='studyProjectOverview')
                dataAction = 'studyProjectList';

            if( dataAction=='myProjectList' || dataAction=='projectOverview')
                dataAction = 'projectList';
            if(dataAction=='')
                dataAction = 'projectList';
            var $currentEle = $(that.element).find('.metismenu li a[id="'+dataAction+'"]');

            if($currentEle.length==0)
                return false;

            if($currentEle.length>0){
                if($currentEle.parents('.nav-second-level').length>0){//定位在子菜单中
                    $currentEle.parents('.nav-second-level').addClass('in').parent().addClass('selected');
                }
                if($currentEle.parents('.nav-third-level').length>0){//定位在子菜单中
                    $currentEle.parents('.nav-third-level').addClass('in').parent().addClass('selected');
                }
                $currentEle.parent().addClass('active').siblings().removeClass('active');
            }
        }
        //控制菜单显示与否
        ,menuShowOrHide:function (currentUrl) {

            if($('body').hasClass('babieniaovisit'))
                return;

            var isShowMenu = null;
            switch (currentUrl){
                case '/createOrg':
                case '/createOrg/1':
                    isShowMenu = 0;
                    break;
                default:
                    isShowMenu = 1;
                    break;
            }
            if(isShowMenu==0){

                $('#page-wrapper').addClass('menu-l-none');
                $('#left-menu-box').fadeOut('fast');

            }else if(isShowMenu==1){

                $('#page-wrapper').removeClass('menu-l-none');
                $('#left-menu-box').fadeIn('slow');

                //折叠左菜单
                if(currentUrl!='/project/basicInfo'){
                    $('#left-menu-box').find('ul').removeClass('in');
                    $('#left-menu-box').find('li').removeClass('active selected');
                }

            }
        }
        //二级菜单没有就删除父菜单
        ,removeNoMenuUl:function () {
            var that = this;
            $(that.element).find('ul.nav-second-level').each(function () {
                var len = $(this).find('li').length;
                if(len==0){
                    $(this).parents('li').remove();
                }
            })
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');

                switch (dataAction){

                    case 'goMaodingYun':

                        var fileId = $('input#projectFileId').val();
                        if(isNullOrBlank(fileId))
                            fileId = 0;

                        var param = {
                            fileId:fileId,
                            userId:window.baBie.userId
                        };
                        if(window.role.isRootCompany==0){
                            param.depId=window.baBie.depId;
                        }else{
                            param.entId=window.baBie.entId;
                        }
                        var option  = {};
                        option.async = false;
                        option.url = restApi.url_getToken;
                        option.postData = param;
                        m_ajax.postJson(option,function (response) {
                            if(response.code=='0'){

                                param.token=encodeURIComponent(response.data);
                                var url = getUrlParamStr(restApi.url_yun_openMaodingFile,param);
                                window.open(url);

                            }else {
                                S_layer.error(response.info);
                            }
                        });


                        break;
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
