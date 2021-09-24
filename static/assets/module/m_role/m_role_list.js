/**
 * 角色列表
 * Created by wrb on 2018/04/18.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_role_list",
        defaults = {
            selectedRole:null,//选中的role
            doType:1,//1=个人权限，2=部门权限
            selectedCallBack:null,//选择回调
            renderCallBack:null//渲染回调
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;
        this._roleList = [];
        this._selectedRole = null;//选中的角色对象
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.render();
        },
        render: function () {
            var that = this;
            var option = {};
            option.url=restApi.url_listRoleGroup;
            if(that.settings.doType==2)
                option.url=restApi.url_listDepartRoleGroup;

            m_ajax.postJson(option, function (res) {
                if (res.code === '0') {
                    that._roleList = res.data;
                    var html = template('m_role/m_role_list', {roleList:res.data,doType:that.settings.doType});
                    $(that.element).html(html);
                    that.itemHover();
                    that.bindActionClick();
                    $(that.element).find('a[data-toggle="tooltip"]').tooltip({trigger:'hover'});

                    var selectedRoleId = that.settings.selectedRole?that.settings.selectedRole.id:'';
                    if(that._selectedRole && that._selectedRole.id!=null)
                        selectedRoleId = that._selectedRole.id;
                    var $selectedRole = $(that.element).find('.role-item[data-id="'+selectedRoleId+'"] a[data-action="selectedRole"]');
                    if($selectedRole.length>0){
                        $selectedRole.click();
                    }else{
                        $(that.element).find('a[data-action="selectedRole"]').eq(0).click();
                    }

                    rolesControl();
                } else {
                    S_toastr.error(res.info);
                }
            });

        }
        //觉色列表hover事件
        , itemHover:function () {
            var that = this;
            $(that.element).find('.list-group-item .role-item,.list-group-item .group-item').hover(function () {
                $(this).find('.btn-group').show();
            },function () {
                $(this).find('.btn-group').hide();
            });
        }
        , bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').off('click').on('click',function (e) {
                var $this = $(this);
                var dataAction = $this.attr('data-action');

                var roleId = $this.closest('.role-item').attr('data-id');
                var groupId = $this.closest('.group-item').attr('data-id');
                if(roleId!=undefined)
                    groupId = $this.closest('ul.list-group').prev('.group-item').attr('data-id');

                //获取节点数据
                var groupItem = getObjectInArray(that._roleList,groupId);
                var roleItem = getObjectInArray(groupItem.roleList,roleId);
                switch (dataAction){
                    case 'selectedRole'://选中角色
                        that._selectedRole = roleItem;
                        $(that.element).find('a[data-action="selectedRole"]').removeClass('active');
                        $this.addClass('active');
                        if(that.settings.selectedCallBack)
                            that.settings.selectedCallBack(roleItem);
                        break;
                    case 'editRole'://编辑角色
                        var option = {};
                        roleItem.groupId = groupId;
                        option.doType = that.settings.doType;
                        if(that.settings.doType==2){
                            option.title = '编辑部门类型';
                        }else{
                            option.title = '编辑角色';
                        }
                        option.dataInfo = roleItem;
                        option.saveCallBack = function () {
                            that.render();
                        };
                        $('body').m_role_add(option,true);
                        return false;
                        break;
                    case 'delRole'://删除角色
                        S_layer.confirm('确定删除该角色？',function(){
                            var option = {};
                            option.url = restApi.url_deleteRole;
                            option.postData = {
                                id:roleId
                            };
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('操作成功！');
                                    that.render();
                                } else {
                                    S_layer.error(response.info);
                                }
                            });
                        },function(){
                            //S_layer.close($(event));
                        });
                        return false;
                        break;

                    case 'editRoleGroup'://编辑分组

                        var option = {};
                        option.doType = that.settings.doType;
                        if(that.settings.doType==2){
                            option.title = '编辑部门分组';
                        }else{
                            option.title = '编辑分组';
                        }
                        option.dataInfo = groupItem;
                        option.saveCallBack = function () {
                            that.render();
                        };
                        $('body').m_role_group_add(option,true);
                        return false;
                        break;
                    case 'delRoleGroup'://删除分组

                        S_layer.confirm('确定删除该分组？',function(){
                            var option = {};
                            option.url = restApi.url_deleteRoleGroup;
                            option.postData = {
                                id:groupId
                            };
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('操作成功！');
                                    that.render();
                                } else {
                                    S_layer.error(response.info);
                                }
                            });
                        },function(){
                            //S_layer.close($(event));
                        });
                        return false;
                        break;

                    case 'expand'://折叠

                        if($this.find('i').hasClass('fa-caret-down')){
                            $this.parents('.list-group-item').find('ul.list-group').hide();
                            $this.find('i').addClass('fa-caret-right').removeClass('fa-caret-down');
                        }else{
                            $this.parents('.list-group-item').find('ul.list-group').show();
                            $this.find('i').addClass('fa-caret-down').removeClass('fa-caret-right');
                        }
                        return false;
                        break;
                }

            })
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
