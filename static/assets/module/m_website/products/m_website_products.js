/**
 * Created by wrb on 2019/3/7.
 */

;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_website_products",
        defaults = {
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
            if($(window).width()<=768){
                banner = 'phone_banner.png';
            }
            var html = template('m_website/products/m_website_products', {banner:banner});
            $(that.element).html(html);
            //that.bindTab();

            $(that.element).find('a[data-action="menuSwitch"]').on('click',function () {
                var type = $(this).attr('data-type');
                $(that.element).find('.menu-content .content[data-type="'+type+'"]').show().siblings().hide();
                $(this).addClass('fc-dark-blue').removeClass('fc-white').siblings().removeClass('fc-dark-blue').addClass('fc-white');
            });
        }
        , bindTab:function () {
            var that = this;
            $(that.element).find('div.pricing-box[data-type]').on('click',function () {
                $(this).addClass('active').parent().siblings().find('div.pricing-box').removeClass('active');
                var type = $(this).attr('data-type');
                var html = template('m_website/products/m_website_products_'+type, {});
                $(that.element).find('#contentInfo').html(html);
                that.bindAttachPreview();

                var screenWidth = screen.width;
                if(screenWidth<=768){
                    var $box = $(that.element).find('#contentInfo div[data-show-type="2"]');
                    $box.each(function () {
                        var $item = $(this);
                        $item.prepend($item.find('div.col-sm-6:last').clone());
                        $item.find('div.col-sm-6:last').remove();
                    });
                }
            });

        }
        //绑定图片预览事件
        , bindAttachPreview: function () {
            var that = this;
            $.each($(that.element).find('img[data-action="preview"]'), function (i, o) {
                $(o).off('click.preview').on('click.preview', function () {
                    var $a = $(this),aSrc = $a.attr('src');
                    var imgData = [],index = 0;
                    $(that.element).find('img[data-action="preview"]').each(function (i) {
                        if($(this).attr('src')==aSrc){
                            index = i;
                        }
                        imgData.push({
                            alt: '',
                            pid: '',
                            src: $(this).attr('src')
                        })
                    });
                    var photos={
                            title: '',
                            id: 1,
                            start: index,
                            data: imgData
                        }
                    ;
                    layer.photos({
                        photos: photos,
                        shift: 5
                    });
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