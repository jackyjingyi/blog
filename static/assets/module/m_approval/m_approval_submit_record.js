/**
 * 审批提交记录
 * Created by wrb on 2019/9/11.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_submit_record",
        defaults = {
            isDialog:true,
            doType:1,//1=项目审批记录，2=合同审批记录
            type:null,
            projectId:null,//项目Id
            companyId:null,
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyId = window.currentCompanyId;

        this._dynamicAuditMap = {};//审批数据
        this._auditList = [];//审批人
        this._ccCompanyUserList = [];//抄送人

        this.settings.title = '项目审批记录';
        if(this.settings.doType==2)
            this.settings.title = '合同审批记录';

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.getData(function (data) {
                var html = template('m_approval/m_approval_submit_record', {dataList:data});
                that.renderDialog(html,function () {
                    that.bindTrClick();
                });
            })

        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'项目审批记录',
                    area : '980px',
                    content:html,
                    btn:false

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack(layero,index,dialogEle);
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        //重新加载
        ,reRenderContent:function () {
            var that = this;
            that.getData(function (data) {
                var html = template('m_approval/m_approval_submit_record', {dataList:data});
                $(that.element).html(html);
                that.bindTrClick();
            })
        }
        //获取数据
        ,getData:function (callBack) {
            var that = this;

            var type = that.settings.doType==1?'projectSetUp':'contractAudit';
            if(that.settings.type)
                type = that.settings.type;

            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_listAuditHistoryData;
            option.postData = {
                projectId:that.settings.projectId,
                type:type
            };

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    if(callBack)
                        callBack(response.data);
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindTrClick:function () {
            var that = this;
            $(that.element).find('tbody tr[data-id]').off('click').on('click',function () {
                var $this = $(this);
                var type = $this.attr('data-type');
                var dataId = $this.attr('data-id');

                var option = {};
                var data = {};
                option.dataInfo = {
                    id : dataId
                };
                option.saveCallBack = function () {
                    that.reRenderContent();
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();
                };
                $('body').m_form_template_generate_details(option,true);

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
