/**
 * 创建分支机构
 * Created by wrb on 2016/12/17.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_org_partner_add",
        defaults = {
            title:'',
            type:1,//1=分支机构，2=事业合伙人
            isDialog:true,
            companyId:'',
            companyObj:null,
            saveCallBack:null

        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._busInformation = null;//选择的工商信息

        this._title = this.settings.type==1?'分支机构':'事业合伙人';
        this._companyVersion = '';//当前版本

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var $data = {};
            $data.companyObj = {};//添加组织对象
            $data.companyObj.editType = '1';
            if(that.settings.companyObj!=null){
                $data.companyObj.editType = '2';
                $data.companyObj = that.settings.companyObj;
            }
            that.getProjectType(function (data) {

                $data.currentCompanyId = window.currentCompanyId;
                $data.type = that.settings.type;
                $data.serverTypeList = data;

                var html = template('m_org/m_org_partner_add',$data);
                that.renderDialog(html,function () {


                    //if(that.settings.type==1)
                        //that.renderCompanyNameEvent();

                    that.bindActionClick();
                    that.saveCompany_validate();
                });
            });

        }
        //初始化数据并加载模板
        ,renderDialog:function (html,callBack) {
            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'创建'+that._title,
                    area : '750px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var check_1 = $(that.element).find("form").valid();
                        if(!check_1){
                            return false;
                        }else{
                            that.saveCompany();
                        }
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
        ,getProjectType:function (callBack) {
            var option  = {};
            option.url = restApi.url_projectType;
            option.postData = {};
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    if(callBack!=null){
                        return callBack(response.data);
                    }
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //查出权限版本
        ,getRoleVersion:function (callBack) {
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
        //组织保存
        ,saveCompany:function () {
            var that = this;
            var option  = {};
            option.url = restApi.url_subCompany;

            if(that.settings.type==2)
                option.url = restApi.url_businessPartner;

            var $data = $(that.element).find("form").serializeObject();

            if(that.settings.companyObj!=null){//编辑
                $data.id = that.settings.companyObj.id;
            }
            option.postData = $data;
            option.classId = that.element;

            if(that._busInformation && that._busInformation.corpname==option.postData.companyName){
                option.postData.enterpriseId = that._busInformation.enterpriseOrgId;
                option.postData.taxNumber = that._busInformation.taxNumber;
            }

            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    if(that.settings.type!='edit'){
                        response.data.isCurrentSubCompany = 1;
                    }
                    if(that.settings.saveCallBack!=null){
                        return that.settings.saveCallBack(response.data);
                    }
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //删除分支机构事件
        ,deleteSubCompany:function(e){
            var that = this;
            var option  = {};
            option.url = restApi.url_subCompany+'/'+that.settings.companyObj.id;
            S_layer.confirm('您确定要删除吗？',function(){
                m_ajax.get(option,function (response) {
                    if(response.code=='0'){
                        S_toastr.success('删除成功！');
                        if(that.settings.isDialog){
                            S_layer.close(e);
                            delNodeByTree();
                        }
                    }else {
                        S_layer.error(response.info);
                    }
                })
            },function(){})

        }
        //给组织名称增加change focus事件，进行模糊搜索
        ,renderCompanyNameEvent:function(){
            var that = this;
            var $viewBusInfomation = $(that.element).find('a#viewPartyACompany');
            $(that.element).find('#companyName').m_partyA({
                eleId:'companyName',
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
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action],a[data-action]').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'saveCompany'://保存组织
                        that.saveCompany($this);
                        return false;
                        break;
                    case 'deleteSubCompany'://删除组织
                        that.deleteSubCompany($this);
                        break;
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
        ,saveCompany_validate:function(){
            var that = this;
            $(that.element).find("form").validate({
                rules: {
                    companyName:{
                        required:true,
                        maxlength:50
                    },
                    cellphone: {
                        required: true,
                        isMobile: true
                    },
                    userName:{
                        required:true,
                        isEmpty:true
                    }
                },
                messages: {
                    companyName:{
                        required:'请输入'+that._title+'名称!',
                        maxlength:that._title+'名称不超过50位!'
                    },
                    cellphone: {
                        required: "请输入手机号码",
                        isMobile: "请正确填写您的手机号码"
                    },
                    userName:{
                        required:"请输入负责人姓名!",
                        isEmpty:'请输入负责人姓名!'
                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    if (element.hasClass('prov') || element.hasClass('city')) {
                        error.appendTo(element.closest('.col-md-6'));
                    } else {
                        error.insertAfter(element);
                    }
                }
            });
            // 名称空格验证
            jQuery.validator.addMethod("isEmpty", function (value, element) {
                if($.trim(value)==''){
                    return false;
                }else{
                    return true;
                }

            }, "请输入负责人姓名!");
            $.validator.addMethod("checkSpace", function(value, element) {
                var pattern=/^\S+$/gi;
                return this.optional(element) || pattern.test( value ) ;
            }, "密码不应含有空格!");
            // 手机号码验证
            jQuery.validator.addMethod("isMobile", function(value, element) {
                var length = value.length;
                var mobile = regularExpressions.mobile;
                return this.optional(element) || (length == 11 && mobile.test(value));
            }, "请正确填写您的手机号码");
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
