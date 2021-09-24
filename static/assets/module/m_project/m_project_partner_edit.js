/**
 * 基本信息－编辑外部协作单位
 * Created by wrb on 2020/6/18.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_partner_edit",
        defaults = {
            title:null,
            isDialog:true,
            projectId:null,
            projectPartnerList:[],
            saveCallBack:null
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
            var html = template('m_project/m_project_partner_edit',{businessType:that.settings.businessType});
            that.renderDialog(html,function () {

                if(that.settings.projectPartnerList && that.settings.projectPartnerList.length>0){
                    $.each(that.settings.projectPartnerList,function (i,item) {
                        that.renderItem(item);
                    })
                }else{
                    that.renderItem();
                }

            });

        },
        //初始化数据
        renderDialog:function (html,callBack) {
            var that = this;

            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||that.settings.businessType==1?'编辑外部协作单位':'编辑外部合作单位',
                    area : ['800px','600px'],
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var error = [];
                        var flag = true;

                        $(that.element).find('.panel[data-type="panel-item"] form').each(function (i) {
                            if(!$(this).valid()){
                                error.push(i);
                            }
                        });
                        if(error.length>0){
                            flag = false;
                        }
                        if (!flag) {
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }
                        that.save();

                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    //S_layer.resize(layero,index,dialogEle);
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        },
        renderItem:function (item) {
            var that = this;
            var data = {num:$(that.element).find('.panel[data-type="panel-item"]').length+1};
            data = $.extend({}, data, item);
            data.businessType = that.settings.businessType;
            var html = template('m_project/m_project_partner_edit_item',data);
            $(that.element).find('.item-box').append(html);

            var $item = $(that.element).find('.panel[data-type="panel-item"]').last();
            that.save_item_validate($item);
            that.bindActionClick();
        }
        ,save:function () {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_saveProjectProjectPartnerForList;
            option.postData = {};

            var itemList = [];
            $(that.element).find('.panel[data-type="panel-item"]').each(function (i) {
                var data = $(this).find('form').serializeObject();
                var id = $(this).closest('.panel').attr('data-id');
                if(!isNullOrBlank(id))
                    data.id = id;
                itemList.push(data);
            });

            option.postData.list = itemList;
            option.postData.projectId = that.settings.projectId;

            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('操作成功');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //表单验证
        ,save_item_validate:function($item){
            var that = this;
            $item.find('form').validate({
                ignore : [],
                rules: {
                    outerCompany:{
                        required: true
                    },
                    contractName:{
                        required: true
                    },
                    fee:{
                        required: true,
                        number:true,
                        minNumber:true
                    },
                    signDate:{
                        required: true
                    }
                },
                messages: {
                    outerCompany:{
                        required: '请输入单位名称'
                    },
                    contractName:{
                        required: '请输入合同名称'
                    },
                    fee:{
                        required: '请输入合同金额',
                        number:'请输入有效数字',
                        minNumber:'请输入大于0的数字'
                    },
                    signDate:{
                        required: '请选择签订日期'
                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-sm-10'));
                }
            });
            $.validator.addMethod('minNumber', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                if( value<=0){
                    isOk = false;
                }
                return  isOk;
            }, '请输入大于0的数字');
        }
        ,bindActionClick:function () {
            var that = this;

            $(that.element).find('button[data-action],a[data-action]').off('click').on('click',function () {

                var $this = $(this),dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'addItem':
                        that.renderItem();
                        break;

                    case 'delItem':
                        if($(that.element).find('.panel[data-type="panel-item"]').length==0){
                            return false;
                        }
                        $this.closest('.panel[data-type="panel-item"]').remove();
                        $(that.element).find('.panel .num').each(function (i) {
                            $(this).text(i+1);
                        });
                        break;
                }
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


