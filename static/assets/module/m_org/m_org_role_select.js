/**
 * 组织、角色选择
 * Created by wrb on 2019/4/28.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_org_role_select",
        defaults = {
            title: ''//弹窗标题
            , treeUrl: ''//获取树的url
            , selectUserCallback: null//选择人员事件
            , isDialog: true//是否弹窗，默认弹窗
            , isGetUserList: true//是否加载右边人员列表,默认加载
            , saveCallback: null//点击保存(确定)按钮时触发事件
            , delSelectedUserCallback: null//点击删除已选的人员后触发的事件
            , selectNodeCallBack: null//树选择事件
            , treeIconObj: null//树生成的图标对象
            , currOrgTreeObj: {}//当前树选中节点对象
            , selectedUserList: null//当前窗口选中的人员[{id,userId,userName}...]
            , selectedRoleList: null//选择的角色列表
            , selectedDisabled : true//选中的disabled
            , isASingleSelectUser: false//是否单个选择人员，默认false,2为单选且提示不关窗
            , initTreeDataCallBack:null//加载树数据后调用的回调
            , renderTreeCallBack:null//树渲染完后回调
            , afterOpenCallBack:null//打开树回调
            , isShowRole:1//是否展示角色
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        //部门负责人
        this._selectedManagers = {
            multiLevel:null,//多级
            singleLevel:null//单级
        };
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            that.initTreeData(function (data) {

                var $data = {};
                $data.isShowRole = that.settings.isShowRole;
                if (that.settings.selectedUserList != null)
                    $data.selectedUserList = that.settings.selectedUserList;

                var html = template('m_org/m_org_role_select', $data);
                that.renderDialog(html,function () {
                    that.initTreeStructure(data);
                    that.bindActionClick();
                    that.initICheck();
                    that.initSelect2();
                    $(that.element).find('[data-toggle="tooltip"]').tooltip();
                    //提取部门负责人
                    if(that.settings.selectedUserList && that.settings.selectedUserList.length>0){
                        $.each(that.settings.selectedUserList,function (i,item) {
                            if(item.orgType==1)
                                that._selectedDepartManagers.push(item);
                        });
                    }


                });

            });

        }
        //初始化数据并加载模板
        ,renderDialog:function (html,callBack) {
            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'添加审批人',
                    area : '750px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var $data = {};
                        $data.selectedUserList = that.settings.selectedUserList;
                        if(that.settings.saveCallback)
                            that.settings.saveCallback($data);

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
        //初始化树数据
        ,initTreeData: function (callBack) {

            var that = this;
            var option = {};
            option.url = that.settings.treeUrl != null && that.settings.treeUrl != '' ? that.settings.treeUrl : restApi.url_getOrgTreeForSearch;
            m_ajax.get(option, function (response) {
                if (response.code == '0') {
                    if(that.settings.initTreeDataCallBack){
                        that.settings.initTreeDataCallBack(response.info);
                    }
                    if (callBack != null) {
                        return callBack(response.data);
                    }
                } else {
                    S_layer.error(response.info);
                }

            })
        }
        //生成树结构
        ,initTreeStructure: function (orgData) {
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
                //alert(data.node.original.realId);
                var currOrgObj = data.node.original;//获取当前树的对象
                that.settings.currOrgTreeObj = currOrgObj;
                var inst = data.instance;
                var parentOrgObj = inst.get_node(data.node.parent).original;

                if (that.settings.isGetUserList) {

                    that.userDateByPage(data.node.original.realId);//分页
                }
                if (that.settings.selectNodeCallBack != null) {
                    currOrgObj.parentOrgObj = parentOrgObj;
                    return that.settings.selectNodeCallBack(currOrgObj);
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

                if (that.settings.selectNodeCallBack != null) {
                    return that.settings.selectNodeCallBack(currOrgObj,'ready');//字符串ready表示初始化树时才调用此方法
                }
                if (that.settings.isGetUserList) {
                    that.userDateByPage(currOrgObj.realId);
                }
                if(that.settings.renderTreeCallBack!=null){
                    that.settings.renderTreeCallBack();
                }
            }).on('after_open.jstree', function (e, data) {//load_node.jstree

                if(that.settings.afterOpenCallBack){
                    that.settings.afterOpenCallBack(data);
                }
            });
        }
        //人员数据并加载模板
        ,userDateByPage: function (orgId) {
            var that = this;
            var options = {};
            options.orgId = orgId;
            options.isASingleSelectUser = that.settings.isASingleSelectUser;
            options.selectedUserList = that.settings.selectedUserList;
            options.selectedDisabled = that.settings.selectedDisabled;
            options.selectUserCallback = function (data, $ele) {
                that.settings.selectedUserList = data.selectedUserList;
                that.renderSelectedUser();

                if (that.settings.selectUserCallback != null)
                    return that.settings.selectUserCallback(data, $ele);

            };
            options.renderCallBack = function () {
                //第一次进来
                that.renderSelectedUser();
            };
            $(that.element).find('div[data-list="userList"]').m_userList(options);
        }
        //渲染选择项
        ,renderSelectedUser: function () {
            var that = this;
            var html = template('m_org/m_orgByTree_selected_item', {selectedUserList:that.settings.selectedUserList,isASingleSelectUser:that.settings.isASingleSelectUser});
            $(that.element).find('.selectedUserBox').html(html);
            //绑定事件
            that.bindDelSelectedUser();
            that.bindSortable();
        }
        //删除添加的人员
        ,bindDelSelectedUser: function () {
            var that = this;
            $(that.element).find('.selectedUserBox a[data-action="delUser"]').on('click',function () {
                that.delSelectedUser($(this));
            });
        }
        //删除人员相关变量与样式处理
        ,delSelectedUser: function ($this) {
            var that = this;
            var id = $this.attr('data-id'),currentIndex = $this.closest('.selected-user').attr('data-i'),orgType = $this.closest('.selected-user').attr('data-type');
            that.settings.selectedUserList.splice(currentIndex,1);

            var key = null;
            if(orgType==1){

                key = 'singleLevel';

            }else if(orgType==3){

                key = 'multiLevel';
            }

            if(key!=null){
                $(that.element).find('.tab-pane[data-key="'+key+'"] input[name="managerCK"]').prop('checked',false);
                $(that.element).find('.tab-pane[data-key="'+key+'"] input[name="managerCK"]').iCheck('update');
                that._selectedManagers[key] = null;
            }


            $(that.element).find('.userListBox a[data-companyuserid="' + id + '"]').removeClass('btn-u-default').css('cursor', 'pointer');
            that.renderSelectedUser();

            if (that.settings.delSelectedUserCallback != null)
                return that.settings.delSelectedUserCallback(data, obj);
        }
        //搜索人员
        ,renderUserDateBySearch:function () {
            var that = this;
            var option = {};
            option.url = restApi.url_getUserByKeyWord;
            option.postData = {};
            option.postData.keyword = $.trim($(that.element).find('input[name="keyword"]').val());
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var userList = [];
                    if(response.data && response.data.length>0){
                        $.each(response.data,function (i,item) {
                            userList.push({id:item.id,userId:item.userId,userName:item.userName,cellphone:item.cellphone});
                        });
                    }
                    $(that.element).find('div[data-list="userList"]').m_userList({
                        orgUserList:userList,
                        selectedUserList:that.settings.selectedUserList,
                        selectUserCallback:function (data, $ele) {
                            that.settings.selectedUserList = data.selectedUserList;
                            that.renderSelectedUser();
                            if (that.settings.selectUserCallback != null)
                                return that.settings.selectUserCallback(data, $ele);
                        },
                        renderCallBack:function () {
                            //去掉分页
                            $(that.element).find('#userlist-pagination-container').html('');
                            //去掉组织树选中
                            var $tree =  $('#organization_treeH').jstree(true);
                            $tree.deselect_all();
                        }
                    });

                } else {
                    S_layer.error(response.info);
                }
            })
        }
        //checkbox渲染
        ,initICheck:function () {
            var that = this;

            $(that.element).find('.i-checks').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            });

            $(that.element).find('input[name="managerCK"]').on('ifChecked', function(e){

                var $this = $(this),key = $this.closest('.tab-pane').attr('data-key');
                var managerId = $this.val(),managerName = $this.parents('.i-checks').find('.i-checks-span').text(),
                    level = $this.closest('.panel-body').find('select[name="level"]').val();

                var orgType = (key=='singleLevel'?1:3);

                if(that._selectedManagers[key] && that._selectedManagers[key].candidateUserList && that._selectedManagers[key].candidateUserList.length>0){

                    that._selectedManagers[key].candidateUserList.push({id:managerId,name:managerName});
                    //替换
                    that._selectedManagers[key].level = level;
                    $.each(that.settings.selectedUserList,function (i,item) {
                        if(item.orgType==orgType){
                            item = that._selectedManagers[key];
                            return false;
                        }
                    });

                }else{
                    that._selectedManagers[key] = {
                        orgType:orgType,
                        level:level,
                        isNullCondition:1,
                        candidateUserList:[{id:managerId,name:managerName}]
                    };
                    that.settings.selectedUserList.push(that._selectedManagers[key]);
                }
                that.renderSelectedUser();
                return false;
            }).on('ifUnchecked', function(e){

                var $this = $(this),key = $this.closest('.tab-pane').attr('data-key');
                var managerId = $this.val(),level = $this.closest('.panel-body').find('select[name="level"]').val();

                if(that._selectedManagers[key] && that._selectedManagers[key].candidateUserList && that._selectedManagers[key].candidateUserList.length>0){

                    that._selectedManagers[key].level = level;
                    delObjectInArray(that._selectedManagers[key].candidateUserList,function (obj) {
                        return obj.id == managerId;
                    });
                    if(that._selectedManagers[key].candidateUserList==null || that._selectedManagers[key].candidateUserList.length==0){
                        delObjectInArray(that.settings.selectedUserList,function (obj) {
                            return obj.orgType == 1;
                        });
                    }
                }
                that.renderSelectedUser();
                return false;
            });
        }
        ,initSelect2:function () {
            var that = this;
            $(that.element).find('select').select2({
                width: '300px',
                containerCssClass:'select-sm m-t-n-sm',
                language: 'zh-CN',
                minimumResultsForSearch: Infinity
            });
            $(that.element).find('select').on("change", function(e) {
                var key = $(this).closest('.tab-pane').attr('data-key'),level = $(this).val();

                var orgType = key=='singleLevel'?1:3;
                if($(this).closest('.panel-body').find('input[name="managerCK"]').is(':checked')){
                    $.each(that.settings.selectedUserList,function (i,item) {
                        if(item.orgType==orgType){
                            item.level = level;
                            return false;
                        }
                    });
                }
                that.renderSelectedUser();
            })

        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'search'://搜索
                        that.renderUserDateBySearch();
                        break;
                    case 'selectManager'://角色-部门管理员


                        break;
                }
            });
        }
        //已选属性排序拖拽
        , bindSortable: function () {
            var that = this;

            var sortFun = function (id,type) {
                var sortable = Sortable.create(document.getElementById(id), {
                    animation: 200,
                    handle: '.user-item',
                    sort: true,
                    dataIdAttr: 'data-sort-id',
                    ghostClass: 'my-sortable-ghost',
                    chosenClass: 'my-sortable-chosen',
                    dragClass: 'my-sortable-drag',
                    onAdd: function (evt){ //拖拽时候添加有新的节点的时候发生该事件
                        //console.log('onAdd.foo:', [evt.item, evt.from]);
                    },
                    onUpdate: function (evt){ //拖拽更新节点位置发生该事件
                        //console.log('onUpdate.foo:', [evt.item, evt.from]);
                    },
                    onRemove: function (evt){ //删除拖拽节点的时候促发该事件
                        //console.log('onRemove.foo:', [evt.item, evt.from]);
                    },
                    onStart:function(evt){ //开始拖拽出发该函数
                        //console.log('onStart.foo:', [evt.item, evt.from]);
                    },
                    onSort:function(evt){ //发生排序发生该事件
                        //console.log('onSort.foo:', [evt.item, evt.from]);
                    },
                    onEnd: function(evt){ //拖拽完毕之后发生该事件
                        //console.log('onEnd.foo:', [evt.item, evt.from]);
                        //console.log(evt);
                        var key = (type==1?'singleLevel':'multiLevel');
                        that._selectedManagers[key].candidateUserList = sortList(evt.oldIndex,evt.newIndex,that._selectedManagers[key].candidateUserList);

                        $.each(that.settings.selectedUserList,function (i,item) {
                            if(item.orgType==type){
                                item = that._selectedManagers[key];
                                return false;
                            }
                        });

                    }
                });
            };
            if($(that.element).find('#sortableUser1').length>0)
                sortFun('sortableUser1',1);

            if($(that.element).find('#sortableUser3').length>0)
                sortFun('sortableUser3',3);
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
