/**
 * Created by wrb on 2019/3/14.
 */

;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_website_faq",
        defaults = {
            activeId:null
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
            that.render();
        }
        , render: function () {
            var that = this;

            var banner = 'banner.png';
            var isShowContent = true,isPhone = false;
            if($(window).width()<=768){
                isPhone = true;
                banner = 'phone_banner.png';
                if(that.settings.activeId==null){
                    isShowContent = false;
                    that.settings.activeId = 'faq/update/1';
                }
            }else if(that.settings.activeId==null){
                that.settings.activeId = 'faq/update/1';
            }
            var html = template('m_website/faq/m_website_faq', {banner:banner,isShowContent:isShowContent,isPhone:isPhone});
            $(that.element).html(html);

            if(that.settings.activeId){

                //菜单
                $(that.element).find('#leftMenu').m_website_faq_menu({menuList:faq_menu,activeId:that.settings.activeId,isPhone:isPhone,isShowContent:isShowContent},true);

                var suffix = that.settings.activeId.replaceAll('/','_');
                var html = template('m_website/faq/m_website_'+suffix, {isShowContent:isShowContent});
                $(that.element).find('#rightContent').html(html);

                $(that.element).find('img.img-preview').on('click',function () {
                    var img = $(this).attr('src');
                    var imgSrcArr = [],index=0;
                    $(that.element).find('img.img-preview').each(function (i) {
                        if(img==$(this).attr('src'))
                            index = i;
                        imgSrcArr.push({
                            src:$(this).attr('src')
                        })
                    });

                    S_layer.photos(imgSrcArr,index);
                });
            }


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