/**
 * 官网页头
 * Created by wrb on 2018/5/10.
 */

;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_website_header",
        defaults = {
            type : '',
            renderCallBack:null
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderPage();
        }
        , renderPage: function () {
            var that = this;
            var option = {};
            option.url = restApi.url_getCurrUserForLogin;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var html = template('m_website/m_website_header', {rootPath:window.rootPath,userInfo:response.data});
                    $(that.element).html(html);

                    if(that.settings.type!=null){
                        $(that.element).find('ul li[data-type="'+that.settings.type+'"] a').addClass('active').parent().siblings().find('a').removeClass('active');
                    }

                    //下拉菜单
                    $(that.element).find('.nav li[data-type],.menu-bar').hover(function () {

                        $(this).find('.menu-bar').stop(true).slideDown();

                    },function () {
                        $(this).find('.menu-bar').stop(true).slideUp('fast');
                    });

                    //定位下拉菜单位置
                    var positioning = function () {
                        var t = setTimeout(function () {
                            var windowWidth = $(window).width();
                            $(that.element).find('ul.navbar-nav.nav .nav-link-bar').each(function () {
                                var offsetLeft = $(this).offset().left;
                                var $menuBar = $(this).next('.menu-bar');
                                if($menuBar.length>0){
                                    $menuBar.show();
                                    var menuBarCWidth = $menuBar.find('.container').outerWidth();
                                    var positionLeft = offsetLeft - (windowWidth - menuBarCWidth)/2;
                                    var aWidth = 0;
                                    $menuBar.find('a.nav-link').each(function () {
                                        console.log($(this).width());
                                        aWidth += $(this).width();
                                    });
                                    $menuBar.hide();
                                    $menuBar.find('.container').css('padding-left',(positionLeft-aWidth/2+30)+'px');
                                }
                            });
                            clearTimeout(t);
                        },100);

                    };
                    positioning();
                    $(window).resize(function () {
                        positioning();
                    });

                    that.bindActionClick();

                    if(that.settings.renderCallBack)
                        that.settings.renderCallBack();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'showLoginBox'://展示登录
                        $this.parent().find('.login-box').fadeToggle("slow");
                        break;
                    case 'showSmallNav'://展示快捷菜单
                        $(that.element).find('.small-nav-menu').fadeToggle("slow");
                        break;
                    case 'downLoadMaoDingYun'://下载卯丁云
                        downLoadFile({
                            url:restApi.url_yun_maodingClient
                        });
                        break;
                }

            });
            $(that.element).find('li.list-group-item a').on('click',function () {
                $(that.element).find('.small-nav-menu').hide();
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