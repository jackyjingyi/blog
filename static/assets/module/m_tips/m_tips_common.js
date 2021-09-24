/**
 * 操作信息提示
 * Created by wrb on 2019/12/24.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_tips_common",
        defaults = {
            doType:'receiveProjectCost',//收款计划=receiveProjectCost,付款计划=payProjectCost
            option:{},
            isPosition:true,//是否定位到按钮处
            isCookies:true,
            renderCallBack:null

        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        var option = {
            ele:null,
            offset:null,
            ok:null,
            okText:null,
            cancel:null,
            cancelText:null,
            isShowCancel:true,
            isShowCheck:false,
            tipsContent:''//提示内容
        };
        this.settings.option = $.extend({}, option,this.settings.option);

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            //检查cookies是否存在，存在则不提示
            if(that.settings.isCookies===true){
                var cookiesData = Cookies.get('operate_tips');
                if(cookiesData==undefined){
                    cookiesData = {};
                }else{
                    cookiesData = $.parseJSON(cookiesData);
                }
                if(cookiesData[that.settings.doType]==1){
                    return false;
                }
            }

            //每次重新置顶，避免layer offset加上滚动高度
            $('html').scrollTop(0);

            var $btn = that.settings.option.ele;
            if($btn.length==0){
                S_toastr.error('无法定位到操作元素，请刷新试试！');
                return false;
            }
            if(that.settings.option.offset==null){
                var top = $btn.offset().top-10;
                var left = $btn.offset().left-380;
                that.settings.option.offset = [top+'px', left+'px'];
                console.log('top=='+top+'//left=='+left);
            }

            var html = template('m_tips/m_tips_common', {
                doType:that.settings.doType,
                option:that.settings.option
            });

            that.renderDialog(html,function () {

                $(that.element).find('button[data-action="ok"]').on('click',function () {

                    var isCheck = $(that.element).find('input[name="itemCk"]').is(':checked');
                    if(isCheck){
                        var data = {};
                        data[that.settings.doType] = 1;
                        Cookies.set('operate_tips', data);
                    }
                    S_layer.close($(that.element));

                    if(that.settings.option.ok)
                        that.settings.option.ok();


                });
                $(that.element).find('a[data-action="cancel"]').on('click',function () {
                    S_layer.close($(that.element));
                });

                if(that.settings.isPosition===true && that.settings.option.ele && $btn.offset().top>200){
                    $('html').animate({scrollTop:$btn.offset().top-200}, 1)
                }

                if(that.settings.renderCallBack)
                    that.settings.renderCallBack();

            });

        }
        ,renderDialog:function (html,callBack) {
            var that = this;
            S_layer.dialog({
                title: false,
                closeBtn:false,
                area : '300px',
                content:html,
                offset:that.settings.option.offset,
                btn:false

            },function(layero,index,dialogEle){//加载html后触发
                that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                that.element = dialogEle;
                $(dialogEle).css('overflow','inherit');
                if(callBack)
                    callBack();
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
