/**
 * 审批操作-审批意见
 * Created by wrb on 2018/9/6.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_operational_comments",
        defaults = {
            isDialog:true,
            doType:1,//1=同意,2=退回,3=撤销
            dataInfo:null,
            parentElement:null,//父弹窗
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._auditMessage = '';//审批意见
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            if(that.settings.doType==3){//撤销，不需要填写意见
                that.confirm(restApi.url_repealApprove);
                return false;
            }
            if(that.settings.doType==1 && that.settings.dataInfo.isFreeProcess!='1'){//同意，固定流程，条件流程不需要填写意见
                that.enterAuditMessage(function () {
                    that.agree(null,1);
                });
                return false;
            }
            that.settings.dataInfo.doType = that.settings.doType;
            var html = template('m_approval/m_approval_operational_comments', that.settings.dataInfo);

            that.renderDialog(html,function () {
                that.bindActionClick();
            });

        }
        //初始化数据,生成html
        ,renderDialog:function (html,callBack) {
            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'确定审批',
                    area : '400px',
                    btn : false,
                    content:html

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack!=null)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack!=null)
                    callBack();
            }
        }
        //同意
        ,agree:function (auditPerson,t) {
            var that = this;
            var options = {};
            if(t==1 && that.settings.parentElement){
                options.classId = that.settings.parentElement;
            }else{
                options.classId = that.element;
            }
            options.postData = {
                id:that.settings.dataInfo.id,
                auditMessage:that._auditMessage,
                auditPerson:auditPerson
            };
            options.url=restApi.url_agreeExpMain;

            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){

                    S_toastr.success('操作成功');
                    S_layer.close($(that.element));

                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();

                }else {
                    S_layer.error(response.info);
                }

            });
        }
        //退回
        ,confirm:function (url) {
            var that = this;
            var options = {};
            options.classId = that.element;
            options.postData = {
                id:that.settings.dataInfo.id,
                auditMessage:$(that.element).find('textarea[name="auditMessage"]').val()
            };
            options.url = url;

            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){

                    S_toastr.success('操作成功');
                    S_layer.close($(that.element));

                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();

                }else {
                    S_layer.error(response.info);
                }

            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function (e) {
                var $this = $(this),dataAction = $this.attr('data-action');

                switch(dataAction){

                    case 'agreeAndDone'://同意

                        that.enterAuditMessage(function () {
                            that.agree();
                        });
                        break;
                    case 'agreeAndToNext'://同意

                        var options = {};
                        options.isASingleSelectUser = 2;
                        options.isOkSave = false;
                        options.cancelText = '关闭';
                        options.selectUserCallback = function (data,event) {

                            S_layer.confirm('确定同意并转交['+data.userName+']审批？', function () {

                                that.enterAuditMessage(function () {
                                    that.agree(data.companyUserId);
                                });
                                S_layer.close($(event));
                            }, function () {
                                S_layer.close($(event));
                            });

                        };
                        $('body').m_orgByTree(options);
                        break;

                    case 'confirm'://确定

                        if(that.settings.doType==1){
                            that.agree();
                        }else if(that.settings.doType==2){
                            that.confirm(restApi.url_recallExpMain);
                        }else if(that.settings.doType==3){
                            that.confirm(restApi.url_repealApprove);
                        }
                        break;

                    case 'cancel':
                        S_layer.close($(e.target));
                        break;
                }

            });
        },
        //输入审批意见
        enterAuditMessage:function (callBack) {
            var that = this;
            S_layer.dialog({
                title: '审批意见',
                area : ['650px','300px'],
                cancel:false,
                ok : function () {

                    that._auditMessage = $('form#auditMessageFrom textarea[name="auditMessage"]').val();
                    if(callBack)
                        callBack();
                },
                content:'<form class="form-horizontal m" id="auditMessageFrom"><div class="form-group"><label class="col-xs-2 control-label">审批意见：</label><div class="col-xs-10"><textarea class="form-control" name="auditMessage" rows="8"></textarea></div></div>'

            },function(layero,index,dialogEle){//加载html后触发

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
