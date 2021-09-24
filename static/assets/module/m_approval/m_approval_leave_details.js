/**
 * 报销申请详情
 * Created by wrb on 2018/9/4.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_leave_details",
        defaults = {
            isDialog:true,
            id:null,
            closeCallBack:null,
            saveCallBack:null,
            doType: 3// 报销=1=expense,费用=2=costApply,请假=3=leave,出差=4=onBusiness,付款申请=5=projectPayApply
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._uploadmgrContainer = null;
        this._uuid = UUID.genV4().hexNoDelim;//targetId

        this._baseData = null;

        this._title = this.settings.doType==3?'请假':'出差';

        this._currentCompanyUserId = window.currentCompanyUserId;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderContent();

        }
        //渲染弹窗
        ,renderDialog:function (html,callBack) {
            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                var title = that._baseData.userName + '-' + that._title+'申请';
                S_layer.dialog({
                    title: title ||that._title+'申请',
                    area : '980px',
                    fixed:true,
                    //scrollbar:false,
                    btn : false,
                    content:html

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack!=null)
                        callBack();
                    S_layer.resize(layero,index,dialogEle);
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack!=null)
                    callBack();
            }
        }
        //渲染内容
        ,renderContent:function () {
            var that = this;
            var option = {};
            option.url = restApi.url_getLeaveDetailForWeb;
            option.postData = {
                id:that.settings.id
            };
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    that._baseData = response.data;
                    that._baseData.doType = that.settings.doType;
                    that._baseData.title = that._title;
                    that._baseData.currentCompanyUserId = that._currentCompanyUserId;
                    var html = template('m_approval/m_approval_leave_details', that._baseData);
                    that.renderDialog(html,function () {
                        that.bindActionClick();
                    });

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action],a[data-action]').off('click').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');

                switch(dataAction){
                    case 'cancel'://取消
                        S_layer.close($(that.element));
                        break;
                    case 'agree'://同意
                        var option = {};
                        option.dataInfo = {
                            id:that.settings.id,
                            isFreeProcess:that._baseData.isFreeProcess
                        };
                        option.doType = 1;
                        option.parentElement = that.element;
                        option.saveCallBack = function () {
                            that.renderContent();
                            if(that.settings.saveCallBack)
                                that.settings.saveCallBack();
                        };
                        $('body').m_approval_operational_comments(option,true);

                        break;
                    case 'returnBack'://退回

                        var option = {};
                        option.dataInfo = {
                            id:that.settings.id,
                            isFreeProcess:that._baseData.isFreeProcess
                        };
                        option.doType = 2;
                        option.saveCallBack = function () {
                            that.renderContent();
                            if(that.settings.saveCallBack)
                                that.settings.saveCallBack();
                        };
                        $('body').m_approval_operational_comments(option,true);

                        break;
                    case 'cancellation'://撤销

                        var option = {};
                        option.dataInfo = {
                            id:that.settings.id,
                            isFreeProcess:that._baseData.isFreeProcess
                        };
                        option.doType = 3;
                        option.saveCallBack = function () {
                            that.renderContent();
                            if(that.settings.saveCallBack)
                                that.settings.saveCallBack();
                        };
                        $('body').m_approval_operational_comments(option,true);

                        break;
                    case 'preview'://查看文件

                        //window.open($this.attr('data-src'));
                        var fileExt = $this.attr('data-file-ext');
                            fileExt = fileExt.toLowerCase();
                        var fileUrl = $this.attr('data-src');
                        var imgSrcArr = [];
                        if('gif,jpg,jpeg,bmp,png'.indexOf(fileExt)>-1){
                            var index = 0,currentIndex = 0;
                            $(that.element).find('a[data-action="preview"]').each(function (i) {
                                var url = $(this).attr('data-src');
                                var ext = $this.attr('data-file-ext');
                                if('gif,jpg,jpeg,bmp,png'.indexOf(ext)>-1){
                                    imgSrcArr.push({
                                        src:url,
                                        thumb:url
                                    });
                                    if(fileUrl==url){
                                        currentIndex = index;
                                    }
                                    index ++;
                                }

                            });
                            S_layer.photos(imgSrcArr,currentIndex);
                        }else{
                            window.open(fileUrl);
                        }

                        break;
                    case 'remind'://提醒

                        that.remindApprover();
                        break;
                }
                return false;

            });
        }
        //提醒审批人请求
        ,remindApprover:function () {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_remindAuditPerson;
            option.postData = {id:that.settings.id};
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('操作成功！');
                }else {
                    S_layer.error(response.info);
                }
            })
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
