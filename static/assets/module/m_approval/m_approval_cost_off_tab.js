/**
 * 费用核销
 * Created by wrb on 2019/11/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_cost_off_tab",
        defaults = {
            doType:1,//默认=个人核销申请，2=财务核销
            isVerification:false,//是否核销动作
            isDialog:true,
            dataInfo:null,//dataInfo不为null,即编辑
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._layero = {};

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_approval/m_approval_cost_off_tab', {
                data: that._baseData,
                dataInfo:that.settings.dataInfo,
                isVerification:that.settings.isVerification
            });
            that.renderDialog(html,function (layero,index,dialogEle) {

                that.bindActionClick();

                //申请核销
                var $costOff = $(that.element).find('.tab-pane[data-type="costOff"]');
                if(that.settings.isVerification==true){
                    /*if(that.settings.doType==2){//财务核销*/
                        $costOff.m_approval_cost_off_return({
                            dataInfo:that.settings.dataInfo,
                            isFinanceVerification:that.settings.doType==2?1:0,
                            isDialog:false,
                            renderCallBack:function () {
                                $costOff.find('.footer').hide();
                            },
                            saveCallBack : function () {
                                if(that.settings.saveCallBack)
                                    that.settings.saveCallBack();
                            }
                        });
                    /*}else{
                        $costOff.m_approval_cost_off({//个人核销
                            dataInfo:that.settings.dataInfo,
                            isDialog:false,
                            renderCallBack:function () {
                                $costOff.find('.footer').hide();
                            },
                            saveCallBack : function () {
                                if(that.settings.saveCallBack)
                                    that.settings.saveCallBack();
                            }
                        });
                    }*/

                }

                //核销详情
                $(that.element).find('.tab-pane[data-type="costOffRecord"]').each(function (i) {

                    var $this = $(this);
                    var dataI = $this.attr('data-i');
                    var dataItem = that.settings.dataInfo.verificationList[dataI];

                    /*if(dataItem.type=='verification'){
                        $this.m_form_template_generate_details({
                            isDialog:false,
                            //isShowBtn:false,
                            dataInfo : {
                                id:dataItem.id
                            },
                            renderCallBack:function () {
                                if($this.find('.footer button').length>0){
                                    $this.find('.footer').css('position','relative');
                                }
                                $this.find('.footer button[data-action="cancel"]').hide();
                            },
                            saveCallBack : function () {
                                if(that.settings.saveCallBack)
                                    that.settings.saveCallBack();
                            }
                        });
                    }else{*/
                        $this.m_approval_cost_off_return_details({
                            isDialog:false,
                            //isShowBtn:false,
                            dataInfo :dataItem,
                            sumExpAmount:that.settings.dataInfo.sumExpAmount,
                            renderCallBack : function () {
                                if($this.find('.footer button').length>0){
                                    $this.find('.footer').css('position','relative');
                                }
                                $this.find('.footer button[data-action="cancel"]').hide();
                            },
                            saveCallBack : function () {
                                if(that.settings.saveCallBack)
                                    that.settings.saveCallBack();
                            }
                        },true);
                    /*}*/

                });

                //费用申请2
                var $expApply= $(that.element).find('.tab-pane[data-type="expApply"]');
                $expApply.m_form_template_generate_details({
                    isDialog:false,
                    isShowBtn:false,
                    dataInfo : that.settings.dataInfo,
                    saveCallBack : function () {
                        if(that.settings.saveCallBack)
                            that.settings.saveCallBack();
                    }
                },true);


                $(that.element).find('button[data-action="expand"]:last').find('i').removeClass('fa-angle-double-down').addClass('fa-angle-double-up');
                $(that.element).find('button[data-action="expand"]:last').closest('div').find('.content').removeClass('hide');

                var t = setTimeout(function () {
                    S_layer.resize(layero,index,dialogEle);
                    clearTimeout(t);
                },500);

            });

        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'费用核销',
                    area : '980px',
                    content:html,
                    btn:false

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    //S_layer.resize(layero,index,dialogEle);
                    that._layero = {
                        layero:layero,
                        index:index,
                        dialogEle:dialogEle
                    };
                    if(callBack)
                        callBack(layero,index,dialogEle);
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');

                switch (dataAction){
                    case 'confirmCostOff'://保存

                        $(that.element).find('.tab-pane[data-type="costOff"] button[data-action="save"]').click();
                        break;
                    case 'cancel'://取消
                        S_layer.close($(that.element));
                        break;

                    case 'expand'://取消

                        if($this.find('i').hasClass('fa-angle-double-down')){
                            $this.closest('div').find('.content').removeClass('hide');
                            $this.find('i').removeClass('fa-angle-double-down').addClass('fa-angle-double-up');
                        }else{
                            $this.closest('div').find('.content').addClass('hide');
                            $this.find('i').addClass('fa-angle-double-down').removeClass('fa-angle-double-up');
                        }
                        $(that.element).find('.m-dialog-resize').eq(0).removeAttr('style');
                        S_layer.resize(that._layero.layero,that._layero.index,that._layero.dialogEle);
                        break;

                }
                return false;

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
