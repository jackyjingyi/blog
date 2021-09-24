/**
 * 权限类型标示
 * Created by wrb on 2018/3/20.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_role_preview",
        defaults = {
            title:null,
            isDialog:true,
            type:1,
            companyVersion:null,
            renderCallBack:null//弹窗回掉方法

        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._permissions = null;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.initHtmlTemplate();
        },
        //初始化数据
        renderDialog:function (html,callBack) {
            var that = this;
            if(that.settings.isDialog){//以弹窗编辑
                var width = $(window).width();
                if(width>=1250)
                    width = 1250;

                S_layer.dialog({
                    title: that.settings.title || '权限预览',
                    area : [width+'px','670px'],
                    maxmin:true,
                    content:html,
                    cancelText:'关闭',
                    cancel:function () {
                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                });
            }else{//不以弹窗编辑

            }
        }
        //生成html
        ,initHtmlTemplate:function () {
            var that = this;
            that.getRoleList(function (data) {
                var html = template('m_role/m_role_preview',{
                    rolePermissions:data
                });
                that.renderDialog(html,function () {
            
                    that.bindRadioClick();
                    $(that.element).find('input[name="roleType"]').eq(that.settings.type-1).click();

                    if(that.settings.companyVersion==3){
                        $(that.element).find('input[value="3"][name="roleType"]').closest('.radio').removeClass('hide');
                    }

                    if(that.settings.renderCallBack!=null)
                        that.settings.renderCallBack(that.element);

                });
            });
        }
        //查出权限列表
        ,getRoleList:function (callBack) {
            var that = this;
            var options={};
            options.url= restApi.url_getPermissionByCompanyRole;
            options.postData = {
                type:that.settings.type
            };
            m_ajax.postJson(options,function (response) {
                if(response.code=='0'){

                    that._permissions = response.data;
                    if(callBack!=null){
                        return callBack(response.data);
                    }
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //选择事件
        ,bindRadioClick:function () {
            var that = this;
            $(that.element).find('input[name="roleType"]').on('click',function () {

                var index = parseInt($(this).val())-1;
                $(that.element).find('#rolePreview').m_role_view({
                    isView:true,
                    role:{},
                    dataInfo:that._permissions[index]
                },true);

            });
            $(that.element).find('.radio label').on('click',function () {
                if(!$(this).prev().is(':checked'))
                    $(this).prev().click();

                return false;
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


