/**
 * 角色人员列表
 * Created by wrb on 2018/04/24.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_role_users",
        defaults = {
            role:null,//角色对象
            saveCallBack:null,//操作保存回调
            doType:1,//1=个人权限，2=部门权限
            leaderList:null,//负责人列表
            renderCallBack:null
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;
        this._userList = [];//当前人员列表
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
            option.url=restApi.url_getUserByRoleId;
            option.postData = {
                roleId:that.settings.role.id
            };
            m_ajax.postJson(option, function (res) {
                if (res.code === '0') {
                    that._userList = res.data;

                    var leaderIds = '';
                    if(that.settings.leaderList && that.settings.leaderList.length>0){
                        $.each(that.settings.leaderList,function (i,item) {
                            leaderIds += item.companyUserId+',';
                        })
                    }

                    var html = template('m_role/m_role_users', {
                        userList:res.data,
                        role:that.settings.role,
                        companyUserId:window.currentCompanyUserId,
                        leaderIds:leaderIds
                    });
                    $(that.element).html(html);
                    that.initUserICheck();
                    that.bindActionClick();
                    rolesControl();



                    if(that.settings.renderCallBack)
                        that.settings.renderCallBack(that._userList);

                } else {
                    S_toastr.error(res.info);
                }
            });
        }
        //初始ICheck
        ,initUserICheck:function () {
            var that = this;
            var ifChecked = function (e) {
                $(that.element).find('input[name="userCK"]').prop('checked',true);
                $(that.element).find('input[name="userCK"]').iCheck('update');
            };
            var ifUnchecked = function (e) {
                $(that.element).find('input[name="userCK"]').prop('checked',false);
                $(that.element).find('input[name="userCK"]').iCheck('update');
            };
            $(that.element).find('input[name="userAllCK"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);
            var ifItemChecked = function (e) {
                that.isAllCheck();
            };
            var ifItemUnchecked = function (e) {
                that.isAllCheck();
            };
            $(that.element).find('input[name="userCK"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifItemUnchecked).on('ifChecked.s', ifItemChecked);
        }
        //判断全选是否该选中并给相关处理
        ,isAllCheck:function () {
            var that =this;
            var len = $(that.element).find('input[name="userCK"]:checked').length;
            if(len==that._userList.length){
                $(that.element).find('input[name="userAllCK"]').prop('checked',true);
                $(that.element).find('input[name="userAllCK"]').iCheck('update');
            }else{
                $(that.element).find('input[name="userAllCK"]').prop('checked',false);
                $(that.element).find('input[name="userAllCK"]').iCheck('update');
            }
        }
        //添加人员
        ,choseUser:function (userList) {

            var that=this,options = {};

            options.title = '添加人员';
            options.selectedUserList = userList;
            options.saveCallback = function (data) {

                var userList = [];
                $.each(data.selectedUserList,function (index,item) {
                    userList.push(item.id);
                });
                that.saveRoleUser(userList);
            };
            $('body').m_orgByTree(options);
        }
        //保存人员
        , saveRoleUser:function (userList) {
            var that = this;
            var options={};
            options.url= restApi.url_saveRoleUser;
            options.postData = {};
            options.postData.roleId = that.settings.role.id;
            options.postData.companyUserList = userList;
            m_ajax.postJson(options,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    that.render();
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //删除人员
        , delRoleUser:function (userList) {
            var that = this;
            var options={};
            options.url= restApi.url_deleteRoleUser;
            options.postData = {};
            options.postData.roleId = that.settings.role.id;
            options.postData.companyUserList = userList;
            m_ajax.postJson(options,function (response) {
                if(response.code=='0'){
                    S_toastr.success('删除成功！');
                    that.render();
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //移交负责人
        , transferSys:function (data) {
            var that = this;
            var options= {};
            options.classId = 'body';
            options.url = restApi.url_transferSys;
            options.postData = {
                userId:data.userId,
                type:2
            };
            m_ajax.postJson(options,function (response) {
                if(response.code=='0'){
                    //S_layer.close($(event));
                    S_layer.success('处理成功，请重新登录!','提示',function(){
                        window.location.href = window.serverPath+'/iWork/sys/logout';
                    })
                }else {
                    S_layer.error(response.info);
                }
            });
        }
        //事件绑定
        , bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'addRoleUser'://添加人员

                        var userList = [];
                        $(that.element).find('#table-role-users tr[data-id]').each(function () {
                            userList.push({
                                id:$(this).attr('data-id'),
                                userName:$(this).attr('data-name')
                            })
                        });
                        that.choseUser(userList);
                        return false;
                        break;
                    case 'delRoleUser'://删除人员

                        var userList = [];
                        $(that.element).find('#table-role-users input[name="userCK"]:checked').each(function () {
                            userList.push($(this).closest('tr').attr('data-id'));
                        });
                        that.delRoleUser(userList);
                        return false;
                        break;
                    case 'transferSys'://移交负责人data,event
                        var options = {};
                        options.title = '移交负责人';
                        options.isASingleSelectUser = true;
                        options.selectedUserList = [{
                            id:that._userList[0].companyUserId,
                            userName:that._userList[0].userName
                        }];
                        options.isOkSave = false;
                        options.cancelText = '关闭';
                        options.selectUserCallback = function (data,event) {

                            S_layer.confirm('确定将负责人更换为“'+data.userName+'”?',function(){

                                that.transferSys(data,event);

                            },function(){
                                //S_layer.close($(event));
                            });
                        };

                        $('body').m_orgByTree(options);
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
