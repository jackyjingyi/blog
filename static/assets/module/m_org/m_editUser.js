/**
 * 添加人员，编辑人员
 * Created by wrb on 2016/12/16.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_editUser",
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

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var $data = {};

            that.getDepartByCompanyId(function () {

                $data.dataInfo = {};//添加人员对象
                $data.dataInfo.departList = [];
                $data.orgList = that._orgList;
                $data.adminFlag = that._adminFlag;
                if (that.settings.dataInfo != null) {//编辑
                    $data.dataInfo = that.settings.dataInfo;
                    if($data.dataInfo.roleList){
                        var roleIds = [];
                        $.each($data.dataInfo.roleList,function (i,item) {
                            roleIds.push(item.id);
                        });
                        $data.dataInfo.roleIds = roleIds.join(',');//用于判断已选择的职责
                    }

                } else {
                    var org = {
                        "id": null,
                        "companyId": null,
                        "departId": null,
                        "cuId": null,
                        "userId": null,
                        "serverStation": null
                    };
                    $data.dataInfo.departList.push(org);
                    $data.dataInfo.departList[0].departId = that.settings.realId;
                }

                var html = template('m_org/m_editUser', $data);
                that.renderDialog(html,function () {

                    $(that.element).find('a[data-action="delDepartServerStation"]').eq(0).addClass('hide');

                    that.initPositionTypeSelect2();
                    that.initSelect2ByMajor();
                    that.initSelect2ByDepartName();
                    that.initSelect2ByDuties();
                    that.bindActionClick();
                    that.saveUser_validate();
                })

            });
        }
        //初始化数据并加载模板
        , renderDialog: function (html,callBack) {
            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'添加人员',
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
        //获取部门列表
        , getDepartByCompanyId: function (callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_getDepartByCompanyId + '/' + that.settings.companyId;
            m_ajax.get(option, function (response) {
                if (response.code == '0') {
                    that._orgList = response.data;
                    if (callBack != null) {
                        callBack();
                    }
                } else {
                    S_layer.error(response.info);
                }
            })
        }
        //初始化岗位select2
        , initPositionTypeSelect2:function () {
            var that = this;
            var data = [
                {id:'1',text:'管理人员'},
                {id:'2',text:'技术人员'}];

            $(that.element).find('select[name="positionType"]').select2({
                width: '100%',
                allowClear: true,
                language: "zh-CN",
                placeholder: "请选择岗位",
                minimumResultsForSearch: Infinity,
                data: data
            });
            if(that.settings.dataInfo && that.settings.dataInfo.positionType){
                $(that.element).find('select[name="positionType"]').val(that.settings.dataInfo.positionType).trigger('change');
            }else{
                $(that.element).find('select[name="positionType"]').val('').trigger('change');
            }
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
                            if(that.settings.dataInfo && that.settings.dataInfo.majorName)
                                $(that.element).find('input[name="majorName"]').val(that.settings.dataInfo.majorName);

                        }
                    },true);

                } else {
                    S_layer.error(response.info);
                }
            })
        }
        //初始化部门select2
        , initSelect2ByDepartName:function ($ele) {
            var that = this;
            if($ele==null)
                $ele = $(that.element);
            var selectOption = {
                width: '100%',
                allowClear: true,
                language: "zh-CN",
                placeholder: "请选择部门",
                minimumResultsForSearch: Infinity
            };
            $ele.find('select[name="departIdSel"]').select2(selectOption);
            $ele.find('select[name="departIdSel"]').on("select2:open", function (e) {

                /*$(this).find('option[value="d18bda5241da402c965923aca6554fb0"]').prop('disabled',true);
                $(this).find('option[value="464723647b4a471fb776b034596ff73c"]').prop('disabled',true);
                $(this).find('option[value="ba2451e5dc74408eb5015bfa291c8151"]').prop('disabled',true);*/

                var $this = $(this);
                var departIds = [];
                //获取所有选中的部门
                $('select[name="departIdSel"]').each(function () {
                    var id = $(this).val();
                    departIds.push(id);
                });
                var selectedId = $this.val();
                $this.find('option').prop('disabled',false);
                $('.select2-container .select2-results__option').removeAttr('aria-disabled');
                //置灰已选的部门
                setTimeout(function () {
                    $.each(departIds,function (i,item) {
                        if(item=='')
                            return true;

                        if(item!=selectedId){
                            $this.find('option[value="'+item+'"]').prop('disabled',true);
                            $('.select2-container .select2-results__option').each(function (i) {
                                var id = $(this).attr('id');
                                if(id!=undefined && id.indexOf(item)>-1){
                                    $(this).attr('aria-disabled',true);//aria-disabled="true"
                                    $(this).removeAttr('aria-selected');
                                }
                            });
                        }

                    });
                },100)

            });
        }
        //初始化职责{type==1=新添加}
        , initSelect2ByDuties:function ($ele,type) {
            var that = this;
            if($ele==null)
                $ele = $(that.element);

            var data = [
                {id:'departManager',text:'部门主管'},
                {id:'financeManager',text:'部门财务主管'},
                {id:'adminManager',text:'部门行政主管'},
                {id:'projectManager',text:'部门项目主管'}];

            $ele.find('select[name="duties"]').select2({
                width: '100%',
                allowClear: true,
                language: "zh-CN",
                placeholder: "请选择职责",
                minimumResultsForSearch: Infinity,
                multiple:true,
                data: data
            });

            if(that.settings.dataInfo && that.settings.dataInfo.departList && type==null){
                $.each(that.settings.dataInfo.departList,function (i,item) {
                    var $select = $ele.find('.depart-item[data-i="'+i+'"] select[name="duties"]');
                    if(item.roleList && item.roleList.length>0){
                        var roleIds = [];
                        $.each(item.roleList,function (ci,citem) {
                            roleIds.push(citem.id);
                        });
                        $select.val(roleIds).trigger('change');
                    }else{
                        $select.val('').trigger('change');
                    }
                });
            }else{
                $ele.find('select[name="duties"]').val('').trigger('change');
            }
        }
        //人员保存
        , saveUser: function (e) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_saveCompanyUser;
            var $data = $(that.element).find('form#basicInfo').serializeObject();
            $data.departList = [];

            $(that.element).find('.depart-item').each(function () {
                var obj = {};
                obj.departId = $(this).find('select[name="departIdSel"] option:selected').val();
                obj.serverStation = $(this).find('input[name="serverStation"]').val();
                if (that.settings.dataInfo != null) {
                    var dataDepartId = $(this).find('select[name="departIdSel"]').attr('data-depart-id');
                    if (dataDepartId != undefined && dataDepartId != '') {
                        obj.id = dataDepartId;
                    }
                    obj.userId = that.settings.dataInfo.userId;
                }
                var duties = $(this).find('select[name="duties"]').val();
                var dutiesArr = [];
                if(duties){
                    $.each(duties,function (i,item) {
                        dutiesArr.push({id:item});
                    });
                }
                obj.roleList = dutiesArr;
                $data.departList.push(obj);
            });
            $data.companyId = that.settings.companyId;
            $data.cellphone = $(that.element).find('input[name="cellphone"]').val();
            if (that.settings.dataInfo != null) {
                $data.id = that.settings.dataInfo.id;
                $data.userId = that.settings.dataInfo.userId;
            }

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
        //按钮事件绑定
        , bindActionClick: function () {
            var that = this;
            $(that.element).find('button[data-action],.m-edit-user a[data-action]').on('click', function () {
                var dataAction = $(this).attr('data-action');

                if (dataAction == 'addDepartServerStation') {

                    that.addDepartServerStation();

                } else if (dataAction == 'delDepartServerStation') {

                    $(this).closest('.depart-item').remove();
                }
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
                    , email: {
                        email: true
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
                    , email: {
                        email: '请输入正确的邮箱！'
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
