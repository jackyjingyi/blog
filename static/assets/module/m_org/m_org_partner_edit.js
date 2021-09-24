/**
 * 设置别名
 * Created by wrb on 2016/12/16.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_org_partner_edit",
        defaults = {
            title:null,
            isDialog:true,
            companyId:null,
            companyOriginalName:null,
            companyAlias:null,
            relationTypeId:null,
            enterpriseId:null,//工商信息ID
            type:null,//subCompany,partner
            saveCallback:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        if(this.settings.type=='subCompany')
            this.settings.title = '编辑分支机构';

        this._companyVersion = '';//当前版本
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var opt = {
                companyOriginalName:that.settings.companyOriginalName,
                companyAlias:that.settings.companyAlias,
                relationTypeId:that.settings.relationTypeId,
                enterpriseId:that.settings.enterpriseId,
                type:that.settings.type
            };
            var html = template('m_org/m_org_partner_edit',opt);
            that.renderDialog(html,function () {

                //if(that.settings.type=='subCompany')
                    //that.renderCompanyNameEvent();

                that.initValidate();
                that.bindActionClick();
                /*that.getRoleVersion(function () {
                    that.bindActionClick();
                });*/

            });
        }
        //初始化数据并加载模板
        , renderDialog:function (html,callBack) {
            var that = this;
            S_layer.dialog({
                title: that.settings.title||'编辑事业合伙人',
                area : '430px',
                content:html,
                cancel:function () {
                },
                ok:function () {

                    if(!$('form.editAliasForm').valid()){
                        return false;
                    }else{
                        that.submitFunction();
                    }
                }

            },function(layero,index,dialogEle){//加载html后触发
                that.element = dialogEle;
                if(callBack)
                    callBack();
            });
        }
        , submitFunction:function () {
            var that = this;
            var option  = {};
            option.url = restApi.url_setBusinessPartnerNickName;
            option.postData = {};
            option.postData.companyId = that.settings.companyId;
            //option.postData.relationTypeId  = $(that.element).find('input[name="roleType"]:checked').val();

            if($(that.element).find('input[name="companyName"]').length>0)
                option.postData.companyName = $(that.element).find('input[name="companyName"]').val();

            if(that._busInformation && that._busInformation.corpname==option.postData.companyName){
                option.postData.enterpriseId = that._busInformation.enterpriseOrgId;
                option.postData.taxNumber = that._busInformation.taxNumber;
            }

            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    if(that.settings.saveCallback)
                        that.settings.saveCallback(option.postData.companyName);
                }else {
                    S_layer.error(response.info);
                }
            });
        }
        //查出权限版本
        , getRoleVersion:function (callBack) {
            var that = this;
            var options={};
            options.url= restApi.url_getCompanyRole;
            m_ajax.postJson(options,function (response) {
                if(response.code=='0'){

                    that._companyVersion = response.data;

                    if(response.data==3)
                        $(that.element).find('input[value="3"][name="roleType"]').closest('.radio').removeClass('hide');

                    if(callBack)
                        callBack();
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //给组织名称增加change focus事件，进行模糊搜索
        , renderCompanyNameEvent:function(){
            var that = this;
            var $viewBusInfomation = $(that.element).find('a#viewPartyACompany');
            $(that.element).find('#companyName').m_partyA({
                eleId:'companyName',
                popoverStyle:{'max-width':'290px'},
                inputChangeCallBack:function (txt) {
                    //判断信息图标是否展示
                    if(that._busInformation && that._busInformation.corpname==txt){
                        $viewBusInfomation.show();
                    }else{
                        $viewBusInfomation.hide();
                    }
                },
                selectCallBack:function (data) {
                    that._busInformation = data;
                    $viewBusInfomation.show();
                    $(that.element).find('input[name="taxNumber"]').val((data && !isNullOrBlank(data.taxNumber))?data.taxNumber:'');
                }
            });
        }
        //按钮事件绑定
        , bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'roleRightsPreView':
                        var option = {};
                        option.type = $(that.element).find('input[name="roleType"]:checked').val();
                        option.companyVersion = that._companyVersion;
                        $('body').m_role_preview(option);
                        break;
                    case 'viewPartyACompany'://查看组织工商信息

                        if(!that._busInformation)
                            return false;

                        $this.m_partyA_info({
                            busInformation:that._busInformation,
                            clearOnInit:true,
                            popoverClass: 'z-index-layer'
                        },true);

                        break;
                }
            });
        }
        , initValidate:function(){
            var that = this;
            $('form.editAliasForm').validate({
                rules: {
                    companyName:{
                        required:true
                    }/*,
                    companyAlias:{
                        required:true
                    }*/
                },
                messages: {
                    companyName:{
                        required:'请输入组织名称!'
                    }/*,
                    companyAlias:{
                        required:'请输入别名!'
                    }*/
                },
                errorPlacement: function (error, element) {
                    error.insertAfter(element);
                }
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
