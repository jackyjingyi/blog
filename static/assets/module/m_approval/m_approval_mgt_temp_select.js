/**
 * 审批模板选择
 * Created by wrb on 2020/1/3.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_mgt_temp_select",
        defaults = {
            isDialog:true,
            selectedOrg:null,//当前选中组织
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyUserId = window.currentCompanyUserId;

        this._currPageType = 1;//1=最近模板，2=全部模板
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.listFormGroupForTemplate(function (data) {
                var html = template('m_approval/m_approval_mgt_temp_select', {dataList:data});
                that.renderDialog(html,function () {

                    that.bindActionClick();
                });
            });
        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'选择任务模板',
                    area : ['960px','650px'],
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {


                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        ,listFormGroupForTemplate:function (callBack) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_listFormGroupForTemplate;
            option.postData = {};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    if(callBack)
                        callBack(response.data);


                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('.approval-temp-box[data-action="addForm"]').off('click').on('click',function (e) {
                var $this = $(this);
                var templateId = $this.attr('data-form-id');
                var doType = 1;
                if(!isNullOrBlank(templateId))
                    doType = 2;

                $('body').m_form_template_settings({
                    doType:doType,
                    selectedOrg:that.settings.selectedOrg,
                    templateId:templateId,
                    saveCallBack:function () {
                        if(that.settings.saveCallBack)
                            that.settings.saveCallBack();
                    }
                },true);
            });

            //定位
            $(that.element).find('.list-group .list-group-item').off('click').on('click',function () {
                var id = $(this).attr('data-id');
                var t = $(that.element).find('h3[data-id="'+id+'"]').position().top;
                var scrollTop = $(that.element).find('.temp-list-box').scrollTop();
                $('.layer-new .layui-layer-content .temp-list-box').scrollTop(t+scrollTop);
            });

        }


    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            // if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            // }
        });
    };

})(jQuery, window, document);
