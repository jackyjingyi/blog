/**
 * 添加人员，编辑人员
 * Created by wrb on 2016/12/16.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_editUserByMySelf",
        defaults = {
            title: null,
            isDialog: true,
            dataInfo: null,
            doType: 'add'//默认添加 edit=编辑
            , saveCallBack: null
            , companyId: ''
            , realId: ''
            , orgList: []
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._adminFlag= window.adminFlag;
        if(this.settings.doType=='edit')
            this.settings.title = '编辑人员';

        this._orgList = [];//部门列表
        this._dataInfo = {};
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var $data = {};

            that.initData(function (data) {

                $data.dataInfo = data;//添加人员对象
                var html = template('m_org/m_editUserByMySelf', $data);
                that.renderDialog(html,function () {
                    $(that.element).find('a[data-action="delDepartServerStation"]').eq(0).addClass('hide');
                    that.initSelect2ByMajor();
                    that.saveUser_validate();
                })

            });
        }
        //初始化数据并加载模板
        , renderDialog: function (html,callBack) {
            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'编辑个人信息',
                    area : '900px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        if ( !(that.saveUser_depart_validate() && $(that.element).find('form#basicInfo').valid())) {
                            return false;
                        } else {
                            that.saveUser();

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
        //初始化专业select2
        , initData:function (callback) {
            var that = this;
            var option = {};
            option.url = restApi.url_getCompanyUserInfoById;
            option.postData = {companyUserId:window.currentCompanyUserId};;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._dataInfo = response.data;
                    if(callback){
                        callback(response.data);
                    }

                } else {
                    S_layer.error(response.info);
                }
            })
        }
        //初始化专业select2
        , initSelect2ByMajor:function () {
            var that = this;
            var option = {};
            option.url = restApi.url_getMajor;
            m_ajax.post(option, function (response) {
                if (response.code == '0') {

                    var data = [];
                    if(response.data){
                        $.each(response.data,function (i,item) {
                            data.push({id:item.id,text:item.name});
                        });
                    }
                    $(that.element).find('select[name="major"]').m_select2_by_search({
                        type:3,
                        isCookies:false,
                        option:{
                            data:data,
                            multiple:false,
                            isResultsText:false,
                            placeholder:'请输入或选择专业',
                            tags:false,
                            containerCssClass:'',
                            width:'100%',
                            key:'majorName'
                        },
                        renderCallBack:function () {
                            if( that._dataInfo.major)
                                $(that.element).find('input[name="majorName"]').val(that._dataInfo.major);
                        }
                    },true);

                } else {
                    S_layer.error(response.info);
                }
            })
        }



        //人员保存
        , saveUser: function (e) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_saveCompanyUserByMyself;
            var $data = $(that.element).find('form#basicInfo').serializeObject();

            $data.companyId = that.settings.companyId;
            $data.cellphone = $(that.element).find('input[name="cellphone"]').val();
            $data.id = window.currentCompanyUserId;
            $data.userId = window.currentUserId;
            //专业
            var $major = $(that.element).find('form#basicInfo select[name="major"]');
            var majorName = $.trim($major.next().find('.new-input input').val());
            var major = $major.find('option[data-text="'+majorName+'"]').attr('value');
            $data.major = majorName;
            if(!isNullOrBlank(major)){
                $data.major = major;
            }
            option.postData = $data;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    S_toastr.success('保存成功！');

                    $('#organization_treeH a.jstree-anchor.jstree-clicked').click();//刷新员工页面数据
                    if (that.settings.saveCallBack != null)
                        return that.settings.saveCallBack(response.data);

                } else {
                    S_layer.error(response.info);
                }
            })
        }
        //添加职位
        , addDepartServerStation: function () {
            var that = this;
            var $item = $(that.element).find('.depart-item').eq(0).clone();
            $item.find('input[name="serverStation"]').val('');
            $item.find('select[name="departIdSel"] option').removeAttr('selected');
            $item.find('a[data-action="delDepartServerStation"]').removeClass('hide');
            $item.find('select[name="departIdSel"]').attr('data-depart-id', '');
            //$item.find('select').select2('destroy').empty();
            $item.find('.select2.select2-container').remove();

            var $addItem = $(that.element).find('a[data-action="addDepartServerStation"]').closest('.form-group');
            $addItem.before($item);
            var $newItem = $addItem.prev();
            that.initSelect2ByDepartName($newItem);
            that.initSelect2ByDuties($newItem,1);

            $newItem.find('a[data-action="delDepartServerStation"]').on('click', function () {
                $(this).closest('.depart-item').remove();
            });


        }

        , saveUser_validate: function () {
            var that = this;
            $(that.element).find('form#basicInfo').validate({
                rules: {
                    userName: 'required',
                    cellphone: {
                        required: true,
                        isMobile: true
                    }

                /*    ,
                    majorName: {
                        required: true
                    }*/

                },
                messages: {
                    userName: '请输入姓名！',
                    cellphone: {
                        required: '请输入手机号码！',
                        isMobile: "请正确填写您的手机号码！"

                    }
                    /*,
                    majorName: {
                        required: '请输入或选择专业！'
                    }*/
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-24-sm-9'));
                }
            });
            // 手机号码验证
            jQuery.validator.addMethod("isMobile", function (value, element) {
                var length = value.length;
                var mobile = regularExpressions.mobile;
                return this.optional(element) || (length == 11 && mobile.test(value));
            }, "请正确填写您的手机号码");



        }
        //验证所属部门不能为空
        , saveUser_depart_validate:function(){
            var that = this;
            var error = 0;
            $(that.element).find('.depart-item select[name="departIdSel"]').each(function(){
                var $this = $(this);
                var value = $this.find('option:selected').val();
                if(value===null || value===void 0 || $.trim(value)===''){
                    var html = '<label id="departIdSel-error" class="error" for="cellphone">';
                    html += '所属部门不能为空';
                    html += '</label>';
                    if ($this.parent().find('#departIdSel-error').length < 1) {
                        $this.parent().append(html);
                    }
                    error+=1;
                }
            });
            if(error>0){
                return false;
            }else{
                return true;
            }
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
