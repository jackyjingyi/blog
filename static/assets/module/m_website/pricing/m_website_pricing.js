/**
 * Created by wrb on 2019/3/7.
 */

;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_website_pricing",
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
            var html = template('m_website/pricing/m_website_pricing', {});
            $(that.element).html(html);
            $(that.element).find('.pricing-hover').hover(function () {

                $(this).find('.i-checks .iradio_square-green').removeClass('disabled');
                $(this).addClass('active').parent().siblings().find('.pricing-box').removeClass('active');

            },function () {

                $(this).find('.i-checks .iradio_square-green').addClass('disabled');
                $(that.element).find('.pricing-box[data-type="3"]').addClass('active').parent().siblings().find('.pricing-box').removeClass('active');
            });


            /*$(that.element).find('a[data-action="expand"]').on('click',function () {
                var iconClass = $(this).find('i').attr('class');
                if(iconClass=='ic-retract'){
                    $(this).find('i').removeClass('ic-retract').addClass('ic-open');
                    $(this).parents('.question-box').addClass('expand');
                }else{
                    $(this).find('i').addClass('ic-retract').removeClass('ic-open');
                    $(this).parents('.question-box').removeClass('expand');
                }
                $(this).parents('.question-box').find('p').fadeToggle("slow");
            });*/
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