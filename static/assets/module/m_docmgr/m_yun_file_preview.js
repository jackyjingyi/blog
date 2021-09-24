/**
 * 项目信息－收款计划-添加节点
 * Created by wrb on 2018/8/10.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_yun_file_preview",
        defaults = {
            fileId:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var param = {
                fileId:that.settings.fileId,
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
                    var html = template('m_docmgr/m_yun_file_preview',{url:url});
                    that.renderDialog(html,function () {

                    });

                }else {
                    S_layer.error(response.info);
                }
            });

        },
        //初始化数据,生成html
        renderDialog:function (html,callBack) {

            var that = this;
            S_layer.dialog({
                title: false,
                area : ['100%','100%'],
                fixed:true,
                scrollbar:false,
                content:html,
                btn:false

            },function(layero,index,dialogEle){//加载html后触发
                that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                that.element = dialogEle;
                if(callBack)
                    callBack(layero,index,dialogEle);
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
