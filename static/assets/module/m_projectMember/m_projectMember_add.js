/**
 * 组织树
 * Created by wrb on 2020/5/18.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_projectMember_add",
        defaults = {
              title: ''//弹窗标题
            , treeUrl: ''//获取树的url
            , isDialog: true//是否弹窗，默认弹窗
            , saveCallback: null//点击保存(确定)按钮时触发事件
            , selectNodeCallBack: null//树选择事件
            , treeIconObj: null//树生成的图标对象
            , currOrgTreeObj: {}//当前树选中节点对象
            //, selectedUserList: null//当前窗口选中的人员[{id,userId,userName}...]
            , selectedUser:null
            , taskId:null//订单ID
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._selectedUserIds = '';//已选人员ids

        this._selectedUser = {
            designUserList:[],
            checkUserList:[],
            examineUserList:[],
            examineApproveUserList:[]
        };
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that =this;
            that.initTreeData(function (data) {


                var html = template('m_projectMember/m_projectMember_add', {});
                that.renderDialog(html,function () {
                    that.initTreeStructure(data);
                    that.bindClickFun();


                    if(that.settings.selectedUser){
                        that._selectedUser = that.settings.selectedUser;

                        $(that.element).find('.selectedUserBox').each(function (i) {
                            var key = $(this).closest('tr').attr('data-type');
                            if(that._selectedUser[key]){
                                that.renderSelectedUser(that._selectedUser[key],$(this));
                            }
                        });
                    }

                });

            });

        }
        //初始化人员选择弹窗
        , renderDialog: function (html,callBack) {
            var that = this;

            if(that.settings.isDialog===true){//以弹窗编辑

                var options = {};
                options.title = '选择人员';
                options.area = ['800px','610px'];
                options.content = html;
                options.cancelText = '取消';
                options.okText = '确定';
                options.cancel = function () {};
                options.ok = function () {

                    that.saveProjectMemberForOrder();

                };
                S_layer.dialog(options,function(layero,index,dialogEle){//加载html后触发
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
        //初始化树数据
        , initTreeData: function (callBack) {

            var that = this;
            var option = {};
            option.url = that.settings.treeUrl != null && that.settings.treeUrl != '' ? that.settings.treeUrl : restApi.url_getOrgTreeForSearch;
            m_ajax.get(option, function (response) {
                if (response.code == '0') {
                    if (callBack != null) {
                        return callBack(response.data);
                    }
                } else {
                    S_layer.error(response.info);
                }

            })
        }
        //生成树结构
        , initTreeStructure: function (orgData) {
            var that = this;
            var $tree = $('#organization_treeH');
            $tree.jstree({
                'core': {
                    'check_callback': true,
                    'data': orgData
                },
                'plugins': ['types'],
                'types': that.settings.treeIconObj || {
                    'default': {
                        'icon': 'fa fa-users'
                    },
                    'independent': {   //独立经营图标
                        'icon': 'fa fa-trademark'
                    },
                    'partner': {       //合作伙伴图标

                        'icon': 'fa fa-share-alt'
                    },
                    'root': {         //根节点图标
                        'icon': 'fa fa-building'
                    }
                }
            }).on('select_node.jstree', function (e, data) {

                var currOrgObj = data.node.original;//获取当前树的对象
                that.settings.currOrgTreeObj = currOrgObj;
                var inst = data.instance;
                var parentOrgObj = inst.get_node(data.node.parent).original;

                that.userDateByPage(data.node.original.realId);//分页

                if (that.settings.selectNodeCallBack != null) {
                    currOrgObj.parentOrgObj = parentOrgObj;
                    that.settings.selectNodeCallBack(currOrgObj);
                }

            }).on('ready.jstree', function (e, data) {//loaded.jstree

                var inst = data.instance;
                var obj = inst.get_node(e.target.firstChild.firstChild.lastChild);
                var currOrgObj = obj.original;//获取当前树的对象
                var tree = $('#organization_treeH').jstree(true);
                var selectedObj = tree.get_selected();

                if (selectedObj != null && selectedObj != undefined) {
                    var selectedTreeObj = tree.get_node(selectedObj[0]);
                    currOrgObj = selectedTreeObj.original;//获取当前树的对象
                }
                that.settings.currOrgTreeObj = currOrgObj;

                that.userDateByPage(currOrgObj.realId);

                if (that.settings.selectNodeCallBack != null) {
                    that.settings.selectNodeCallBack(currOrgObj,'ready');//字符串ready表示初始化树时才调用此方法
                }

            })
        }
        //人员数据并加载模板
        , userDateByPage: function (orgId) {
            var that = this;

            var options = {};
            options.orgId = orgId;
            //options.selectedUserList = that._selectedUser[key];
            options.selectedDisabled = false;
            options.selectUserCallback = function (data, $ele) {
                console.log(data)

                var key = $(that.element).find('tr.active').attr('data-type');
                if(isNullOrBlank(key))
                    key = 'designUserList';

                that._selectedUser[key].push({
                    id: data.companyUserId,
                    userName: data.userName,
                    userId:data.userId,
                    fileFullPath:data.fileFullPath,
                    orgType:2//1=部门负责人，2=成员
                });
                that.renderSelectedUser(that._selectedUser[key]);

            };
            options.renderCallBack = function () {
                //console.log('renderCallBack')
                that.dealSelectedUserClass();
            };
            $(that.element).find('div[data-list="userList"]').m_userList(options);
        }
        , renderSelectedUser : function (data,$ele) {
            var that = this;
            //渲染选择项
            var html = template('m_org/m_orgByTree_selected_item', {
                selectedUserList:data,isASingleSelectUser:false
            });
            if($ele==null){
                $(that.element).find('tr.active .selectedUserBox').html(html);
            }else{
                $ele.html(html);
            }
            //绑定事件
            that.bindDelSelectedUser();
            that.dealSelectedUserClass();
        }
        //删除添加的人员
        , bindDelSelectedUser: function () {
            var that = this;
            $(that.element).find('.selectedUserBox a[data-action="delUser"]').off('click').on('click',function () {
                that.delSelectedUser($(this));
                return false;
            });
        }
        //删除人员相关变量与样式处理
        , delSelectedUser: function ($this) {
            var that = this;
            var id = $this.attr('data-id');
            var key = $this.closest('tr').attr('data-type');
            var activeKey = $(that.element).find('tr.active').attr('data-type');
            if(key==activeKey){
                $(that.element).find('.userListBox a[data-companyuserid="' + id + '"]').removeClass('btn-u-default').css('cursor', 'pointer');
            }
            delObjectInArray(that._selectedUser[key],function (obj) {
                return obj.id == id;
            });
            $this.closest('span.selected-user').remove();
            return false;
        }
        ,dealSelectedUserClass:function () {
            var that = this;
            var key = $(that.element).find('tr.active').attr('data-type');
            if(isNullOrBlank(key))
                key = 'designUserList';

            $(that.element).find('.userListBox a[data-companyuserid]').removeClass('btn-u-default').css('cursor','pointer');
            $.each(that._selectedUser[key],function (i,item) {
                var $userSelect = $(that.element).find('.userListBox a[data-companyuserid="' + item.id + '"]');
                if($userSelect.length>0){
                    $userSelect.addClass('btn-u-default').css('cursor', 'default')
                }

            })

        }
        ,bindClickFun:function () {
            var that = this;
            $(that.element).find('tr').click(function () {
                $(this).addClass('active').siblings().removeClass('active');
                that.dealSelectedUserClass();

            });
        }
        //保存人员
        ,saveProjectMemberForOrder:function () {
            var that = this;
            var option = {};
            option.url = restApi.url_saveProjectMemberForOrder;
            option.postData = {};
            option.postData.id = that.settings.taskId;

            var keyList = ['designUserList','checkUserList','examineUserList','examineApproveUserList'];
            $.each(keyList,function (i,itemKey) {
                option.postData[itemKey] = [];
                $.each(that._selectedUser[itemKey],function (i,item) {
                    option.postData[itemKey].push(item.id);
                });
            });

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    S_toastr.success('保存成功！');
                } else {
                    S_layer.error(response.info);
                }
            })
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
