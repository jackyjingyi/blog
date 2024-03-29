/**
 * 组织树
 * Created by wrb on 2016/12/14.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_orgByTree",
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
            , selectedDisabled : true//选中的disabled
            , isASingleSelectUser: false//是否单个选择人员，默认false,2为单选且提示不关窗
            , isOkSave: true//默认存在“OK” 按钮
            , saveDataUrl: null//直接保存url
            , saveData: null//保存格外的参数
            , okText:null//按钮文字
            , cancelText:null
            , initTreeDataCallBack:null//加载树数据后调用的回调
            , renderTreeCallBack:null//树渲染完后回调
            , afterOpenCallBack:null//打开树回调
            , plugins:['types']//['types','dnd'] 同级拖拽
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._selectedUserIds = '';//已选人员ids
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that =this;
            that.initTreeData(function (data) {

                if (that.settings.isGetUserList) {
                    var $data = {};
                    if (that.settings.selectedUserList != null) {
                        $data.selectedUserList = that.settings.selectedUserList;

                    }
                    $data.isASingleSelectUser = that.settings.isASingleSelectUser;
                    var html = template('m_org/m_orgByTree', $data);
                    that.renderDialog(html,function () {
                        that.initTreeStructure(data);
                    });
                }else{
                    that.initTreeStructure(data);
                }

            });

        }
        //初始化人员选择弹窗
        , renderDialog: function (html,callBack) {
            var that = this;

            if(that.settings.isDialog===true){//以弹窗编辑

                var options = {};
                options.title = that.settings.title || '选择人员';
                options.area = ['800px','510px'];
                options.content = html;
                options.cancelText = that.settings.cancelText || '取消';
                options.okText = that.settings.okText || '确定';
                options.cancel = function () {};
                if(that.settings.isOkSave){
                    options.ok = function () {

                        if(!isNullOrBlank(that.settings.saveDataUrl)){
                            var saveObj = {
                                selectedUserIds : that._selectedUserIds
                            };
                            $.extend(saveObj, that.settings.saveData);
                            var option = {};
                            option.url = that.settings.saveDataUrl;
                            option.postData = saveObj;
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    if (that.settings.saveCallback != null) {
                                        var $data = {};
                                        $data.data = response.data;
                                        $data.selectedUserList = that.settings.selectedUserList;
                                        return that.settings.saveCallback($data);
                                    }
                                } else {
                                    S_layer.error(response.info);
                                }
                            })
                        }else{
                            var $data = {};
                            $data.selectedUserList = that.settings.selectedUserList;
                            if(that.settings.saveCallback)
                                return that.settings.saveCallback($data);
                        }
                    };
                }
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
        , initTreeStructure: function (orgData) {
            var that = this;
            var $tree = $('#organization_treeH');
            $tree.jstree({
                'core': {
                    //'check_callback': true,
                    'check_callback' :  function (op, node, parent, position, more) {
                        if(parent.id==node.parent){
                            return true;
                        }else{
                            return false;
                        }
                    },
                    'themes' : {
                        "responsive": false
                    },
                    'data': orgData
                },
                'plugins': that.settings.plugins,//['types']
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

                if (that.settings.isGetUserList) {
                    that.userDateByPage(data.node.original.realId);//分页
                }
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

                if (that.settings.isGetUserList) {
                    that.userDateByPage(currOrgObj.realId);
                }
                if (that.settings.selectNodeCallBack != null) {
                    that.settings.selectNodeCallBack(currOrgObj,'ready');//字符串ready表示初始化树时才调用此方法
                }
                if(that.settings.renderTreeCallBack!=null){
                    that.settings.renderTreeCallBack(obj);
                }
            }).on('after_open.jstree', function (e, data) {//load_node.jstree

                if(that.settings.afterOpenCallBack){
                    that.settings.afterOpenCallBack(data);
                }

            }).on('move_node.jstree', function(e,data){
                //console.log(data);
                //保存排序
                if(data.parent){
                    var option  = {};
                    option.url = restApi.url_batchOrderDepart;
                    option.postData = {};
                    option.postData.departIdList = [];
                    $(that.element).find('li[role="treeitem"][id="'+data.parent+'"] ul.jstree-children').children('li').each(function () {
                        option.postData.departIdList.push($(this).attr('id'));
                    });
                    m_ajax.postJson(option,function (response) {
                        if(response.code=='0'){
                            S_layer.tips('操作成功！');
                        }else {
                            S_layer.error(response.info);
                        }
                    })
                }

            });
        }
        //人员数据并加载模板
        , userDateByPage: function (orgId) {
            var that = this;

            var renderSelectedUser = function (data) {
                //渲染选择项
                var html = template('m_org/m_orgByTree_selected_item', {selectedUserList:data.selectedUserList,isASingleSelectUser:that.settings.isASingleSelectUser});
                $(that.element).find('.selectedUserBox').html(html);
                //绑定事件
                that.bindDelSelectedUser();
            };

            var options = {};
            options.orgId = orgId;
            options.isASingleSelectUser = that.settings.isASingleSelectUser;
            options.selectedUserList = that.settings.selectedUserList;
            options.selectedDisabled = that.settings.selectedDisabled;
            options.selectUserCallback = function (data, $ele) {
                that._selectedUserIds = data.selectedUserIds;
                that.settings.selectedUserList = data.selectedUserList;
                renderSelectedUser(data);

                if (that.settings.selectUserCallback != null)
                    return that.settings.selectUserCallback(data, $ele);

            };
            options.renderCallBack = function () {
                //第一次进来
                var data = {
                    selectedUserList:that.settings.selectedUserList
                };
                renderSelectedUser(data);
            };
            $(that.element).find('div[data-list="userList"]').m_userList(options);
        }
        //删除添加的人员
        , bindDelSelectedUser: function () {
            var that = this;
            $(that.element).find('.selectedUserBox a[data-action="delUser"]').on('click',function () {
                that.delSelectedUser($(this));
            });
        }
        //删除人员相关变量与样式处理
        , delSelectedUser: function ($this) {
            var that = this;
            var id = $this.attr('data-id');
            $(that.element).find('.userListBox a[data-companyuserid="' + id + '"]').removeClass('btn-u-default').css('cursor', 'pointer');
            $this.closest('span.selected-user').remove();
            delObjectInArray(that.settings.selectedUserList,function (obj) {
                return obj.id == id;
            });
            if (that.settings.delSelectedUserCallback != null)
                return that.settings.delSelectedUserCallback(data, obj);
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
