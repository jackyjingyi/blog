/**
 * 根据角色配置权限
 * Created by wrb on 2018/04/18.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_role_view",
        defaults = {
            isDialog:false,//是否查看弹窗
            dataInfo:null,//创建事业合伙人、分公司权限预览数据
            formType:null,//0=创建事业合伙人、分公司权限预览数据
            isView:false,//为true，只是展示
            role:null,//角色对象
            renderCallBack:null
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;
        this._dataList = null;//请求的列表数据
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.render();
        },
        render: function () {
            var that = this;

            if(that.settings.dataInfo){

                that._dataList = that.settings.dataInfo;
                that.renderPage();
            }else{
                var option = {};
                option.url=restApi.url_getOperatorPermissionByRole;
                option.postData = {
                    roleId:that.settings.role.id
                };
                m_ajax.postJson(option, function (res) {
                    if (res.code === '0') {

                        that._dataList = res.data;
                        that.renderPage();

                    } else {
                        S_toastr.error(res.info);
                    }
                });
            }
        }
        ,renderPage:function () {
            var that = this;

            var html = template('m_role/m_role_view', {
                viewList:that._dataList,
                role:that.settings.role,
                isDialog:that.settings.isDialog,
                formType:that.settings.formType,
                isView:that.settings.isView
            });
            that.renderDialog(html,function () {

                if(!that.settings.isView) {//编辑

                    that.initViewICheck();
                    that.bindActionClick();

                    //若是单个选项，禁用,或当前是负责人，所有都禁用
                    var isPrincipal = that.settings.role && that.settings.role.id=='10001'?true:false;
                    $(that.element).find('input[name^="viewManagerCK"]').each(function () {
                        if($(this).parents('td').find('label.i-checks').length==1 || isPrincipal){
                            $(this).iCheck('disable');
                        }
                    });
                    $(that.element).find('input[name^="operatorManagerCK"]').each(function () {
                        if($(this).parents('td').find('label.i-checks').length==1 || isPrincipal){
                            $(this).iCheck('disable');
                        }
                    });


                }else{
                    $(that.element).find('a[data-action="selectOrg"]').addClass('a-span').addClass('fc-v1-grey');
                    $(that.element).find('input[type="checkbox"][name!="viewCK"]:not(:checked),input[type="radio"]:not(:checked)').each(function () {
                        $(this).closest('.i-checks ').find('.i-checks-span').addClass('fc-v1-grey');
                    });
                    $(that.element).find('input').remove();

                }

                if(that.settings.renderCallBack)
                    that.settings.renderCallBack();

            });
        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑
                var width = $(window).width();
                if(width>=1250)
                    width = 1250;

                S_layer.dialog({
                    title: that.settings.title||'权限展示',
                    area : [width+'px','670px'],
                    maxmin:true,
                    content:html,
                    cancelText:'关闭',
                    cancel:function () {
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
        //初始ICheck
        ,initViewICheck:function () {
            var that = this;
            var ifChecked = function (e) {
                var name = $(this).attr('name');
                var id = $(this).closest('tr').attr('data-id');
                var relationId = $(this).attr('data-relation-id');

                if(name=='roleViewAllCk'){

                    $(that.element).find('input[name^="viewCK"]').not(':disabled').prop('checked',true);
                    $(that.element).find('input[name^="viewCK"]').not(':disabled').iCheck('update');
                    $(that.element).find('input[name^="operatorCK"]').not(':disabled').prop('checked',true);
                    $(that.element).find('input[name^="operatorCK"]').not(':disabled').iCheck('update');

                }else if(name=='viewCK'){

                    $(that.element).find('tr[data-id="'+id+'"] input[name^="viewCK"]').not(':disabled').prop('checked',true);
                    $(that.element).find('tr[data-id="'+id+'"] input[name^="viewCK"]').not(':disabled').iCheck('update');
                    $(that.element).find('tr[data-id="'+id+'"] input[name^="operatorCK"]').not(':disabled').prop('checked',true);
                    $(that.element).find('tr[data-id="'+id+'"] input[name^="operatorCK"]').not(':disabled').iCheck('update');
                }else if(name.indexOf('ManagerCK')>-1){
                    return false;
                }

                /*if(!isNullOrBlank(relationId) && name.indexOf('operatorCK')>-1){
                    var ids = [];
                    if(!isNullOrBlank(relationId)){
                        ids = relationId.split(',');
                    }
                    $.each(ids,function (i,item) {
                        if(!isNullOrBlank(item)){
                            $(that.element).find('input[value="'+item+'"]').prop('checked',true);
                            $(that.element).find('input[value="'+item+'"]').iCheck('update');
                        }
                    });
                }*/

                that.saveRolePermission();
            };
            var ifUnchecked = function (e) {

                var name = $(this).attr('name');
                var id = $(this).closest('tr').attr('data-id');
                var relationId = $(this).attr('data-relation-id');

                if(name=='roleViewAllCk'){

                    $(that.element).find('input[name^="viewCK"]').not(':disabled').prop('checked',false);
                    $(that.element).find('input[name^="viewCK"]').not(':disabled').iCheck('update');
                    $(that.element).find('input[name^="operatorCK"]').not(':disabled').prop('checked',false);
                    $(that.element).find('input[name^="operatorCK"]').not(':disabled').iCheck('update');

                }else if(name=='viewCK'){

                    $(that.element).find('tr[data-id="'+id+'"] input[name^="viewCK"]').not(':disabled').prop('checked',false);
                    $(that.element).find('tr[data-id="'+id+'"] input[name^="viewCK"]').not(':disabled').iCheck('update');
                    $(that.element).find('tr[data-id="'+id+'"] input[name^="operatorCK"]').not(':disabled').prop('checked',false);
                    $(that.element).find('tr[data-id="'+id+'"] input[name^="operatorCK"]').not(':disabled').iCheck('update');
                    that.saveRolePermission();
                }else if(name.indexOf('ManagerCK')>-1){
                    return false;
                }
                /*if(!isNullOrBlank(relationId) && name.indexOf('viewCK')>-1){
                    var ids = [];
                    if(!isNullOrBlank(relationId)){
                        ids = relationId.split(',');
                    }
                    $.each(ids,function (i,item) {
                        if(!isNullOrBlank(item)){
                            $(that.element).find('input[value="'+item+'"]').prop('checked',false);
                            $(that.element).find('input[value="'+item+'"]').iCheck('update');
                        }
                    });
                }*/
                that.saveRolePermission();
            };
            var ifClicked = function (e) {

                var name = $(this).attr('name');
                if(name.indexOf('ManagerCK')>-1){
                    var rangeValue = $(this).parent().attr('data-value');
                    if($(this).val()==2 && isNullOrBlank(rangeValue)){

                        /*S_toastr.error('请先设置选择的数据范围');
                        var t = setTimeout(function () {
                            that.render();
                            clearTimeout(t);
                        },300);*/
                        $(this).closest('.row').find('a[data-action="selectOrg"]').click();
                        var t = setTimeout(function () {
                            that.render();
                            clearTimeout(t);
                        },300);
                        return false;
                    }
                    var data = {
                        groupId:$(this).closest('div.row[data-group-id]').attr('data-group-id'),
                        roleId:that.settings.role.id,
                        permissionId:$(this).closest('tr').attr('data-id'),
                        rangeType:$(this).val()
                    };
                    that.saveDataManager(data);
                }
            };
            $(that.element).find('.i-checks').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked).on('ifClicked.s', ifClicked);


            $(that.element).find('input[name="viewCK"]').each(function () {
                var id = $(this).val();

                var viewCKLen = $(that.element).find('tr[data-id="'+id+'"] input[name^="viewCK"][name!="viewCK"]').length;
                var operatorCKLen = $(that.element).find('tr[data-id="'+id+'"] input[name^="operatorCK"]').length;
                var viewCheckedLen = $(that.element).find('tr[data-id="'+id+'"] input[name^="viewCK"][name!="viewCK"]:checked').length;
                var operatorCheckedLen = $(that.element).find('tr[data-id="'+id+'"] input[name^="operatorCK"]:checked').length;

                if(viewCKLen+operatorCKLen == viewCheckedLen+operatorCheckedLen && viewCKLen+operatorCKLen!=0){
                    $(this).prop('checked',true);
                    $(this).iCheck('update');
                }else{
                    $(this).prop('checked',false);
                    $(this).iCheck('update');
                }
            });

        }
        //保存权限
        ,saveRolePermission:function () {
            var that = this;
            var option = {};
            var permissionIds = [];
            $('#role-view-box').find('input[name^="viewCK"]:checked').each(function () {
                permissionIds.push($(this).val());
            });
            $('#role-view-box').find('input[name^="operatorCK"]:checked').each(function () {
                permissionIds.push($(this).val());
            });
            option.url=restApi.url_saveRolePermission;
            option.postData = {
                roleId:that.settings.role.id,
                permissionIds:permissionIds
            };
            m_ajax.postJson(option, function (response) {
                if (response.code === '0') {
                    S_toastr.success('保存成功！');
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //保存数据或操作范围权限
        ,saveDataManager:function (data) {
            var that = this;
            var option = {};
            option.url=restApi.url_saveDataRangeRolePermission;
            option.postData = data;
            m_ajax.postJson(option, function (response) {
                if (response.code === '0') {
                    S_toastr.success('保存成功！');
                    that.render();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //保存自定义范围权限
        ,saveRoleDataRange:function (data) {
            var that = this;
            var option = {};
            option.url=restApi.url_saveDataRangeUserDefined;
            option.postData = data;
            m_ajax.postJson(option, function (response) {
                if (response.code === '0') {
                    S_toastr.success('保存成功！');
                    that.render();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //选择子项，父项选中
        ,setParentsCheck:function (id) {
            var that = this;
            var $thisTr = $(that.element).find('tr[data-id="'+id+'"]');
            var pid = $thisTr.attr('data-pid');
            var $parentTr = $(that.element).find('tr[data-id="'+pid+'"]');
            if($parentTr.length>0){
                $parentTr.find('input[name="viewCk"]').prop('checked',true);
                $parentTr.find('input[name="viewCk"]').iCheck('update');
                var thisId = $parentTr.attr('data-id');
                that.setParentsCheck(thisId);
            }
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'selectOrg':

                        var rangeValue = $this.parent().attr('data-value');
                        var ids = [];
                        if(!isNullOrBlank(rangeValue))
                            ids = rangeValue.split(',');

                        //为空，初始为当前组织
                        if(ids==null || ids.length==0)
                            ids.push(window.currentCompanyId);

                        var isFinance = $this.attr('data-is-finance'),postParam=null;
                        if(!isNullOrBlank(isFinance) && isFinance==1)
                            postParam = {isFinanceOperator:1};



                        $('body').m_org_select_multiple({
                            selectIds:ids,
                            postParam:postParam,
                            disabledAll:that.settings.role && that.settings.role.id=='10001'?true:false,
                            okCallBack:function (ids,data) {
                                var idstr = ids;
                                if(typeof ids === 'object')
                                    idstr = ids.join(',');
                                var data = {
                                    groupId : $this.closest('div.row[data-group-id]').attr('data-group-id'),
                                    roleId:that.settings.role.id,
                                    permissionId:$this.closest('tr').attr('data-id'),
                                    rangeType:$this.closest('div').find('label input').val(),
                                    rangeValue:idstr
                                };
                                that.saveRoleDataRange(data);
                            }
                        },true);

                        break;
                }
            });
        }


    });

    /*
     1.一般初始化（缓存单例）： $('#id').pluginName(initOptions);
     2.强制初始化（无视缓存）： $('#id').pluginName(initOptions,true);
     3.调用方法： $('#id').pluginName('methodName',args);
     */
    $.fn[pluginName] = function (options, args) {
        var instance;
        var funcResult;
        var jqObj = this.each(function () {

            //从缓存获取实例
            instance = $.data(this, "plugin_" + pluginName);

            if (options === undefined || options === null || typeof options === "object") {

                var opts = $.extend(true, {}, defaults, options);

                //options作为初始化参数，若args===true则强制重新初始化，否则根据缓存判断是否需要初始化
                if (args === true) {
                    instance = new Plugin(this, opts);
                } else {
                    if (instance === undefined || instance === null)
                        instance = new Plugin(this, opts);
                }

                //写入缓存
                $.data(this, "plugin_" + pluginName, instance);
            }
            else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };

})(jQuery, window, document);
