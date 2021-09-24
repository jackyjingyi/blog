/**
 * 选择人员
 * Created by wrb on 2018/10/15.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_select_org_users",
        defaults = {
            isDialog:true,
            isSelectUser:false,//是否只选择人员
            selectedUserList:null,//已选择列表
            okCallBack:null
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;
        this._rootData = null;//根级对象
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.render();
        }
        , render: function () {
            var that = this;

            var html = template('m_org/m_select_org_users', {});
            that.renderPage(html,function () {

                that.renderTree();
                that.bindActionClick();

                if(that.settings.selectedUserList!=null && that.settings.selectedUserList.length>0){
                    $.each(that.settings.selectedUserList,function (i,item) {
                        that.selectClick(item);
                    });
                }

            });
        }
        //渲染界面
        ,renderPage:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title|| '选择人员或组织',
                    area : ['600px','540px'],
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {
                        if(that.settings.okCallBack)
                            that.settings.okCallBack(that.getSelectUsers());
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
        ,renderTree:function () {
            var that = this;
            var $tree = $('#orgUsersTree');
            $tree.jstree({
                'core': {
                    'check_callback': true,
                    'data':function (node, callback) {
                        var option = {};
                        option.async = false;
                        option.postData = {};
                        var jsonStr='[]';
                        var jsonArray = eval('('+jsonStr+')');
                        if(node.id === '#'){
                            option.url = restApi.url_getOrgUsersTree;
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    var arrays= response.data;
                                    var arr = {
                                        'id':arrays.id,
                                        'text':arrays.text,
                                        'pid':null,
                                        'children':true,
                                        'type':arrays.type
                                    };
                                    jsonArray.push(arr);
                                    that._rootData = arr;
                                } else {
                                    S_layer.error(response.info);
                                }
                            });
                            callback.call(this, jsonArray);
                        }else{
                            option.url = restApi.url_getOrgUsersTree;
                            option.postData = {
                                orgId : node.original.id
                            };
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    var arrays= response.data.orgTreeDetailList;
                                    if(arrays!=null && arrays.length>0){
                                        for(var i=0 ; i<arrays.length; i++){
                                            var arr = {
                                                'id':arrays[i].id,
                                                'pid':node.id,
                                                'text':arrays[i].text,
                                                'children':arrays[i].isSonDepart=='1'?true:false,
                                                'type':arrays[i].type
                                            };
                                            jsonArray.push(arr);
                                        }
                                    }
                                } else {
                                    S_layer.error(response.info);
                                }
                            });
                            callback.call(this, jsonArray);
                        }
                    }
                },
                'plugins': ['noclose', 'types', 'wholerow'],
                'types': {
                    'default': {
                        'icon': 'fa fa-users'
                    },
                    'independent': {   //独立经营图标
                        'icon': 'fa fa-users'
                    },
                    'partner': {       //事业合伙人图标
                        'icon': 'iconfont rounded icon-cooperation'
                    },
                    'partnerContainer': {       //事业合伙人容器图标
                        'icon': 'iconfont rounded icon-cooperation'
                    },
                    'subCompany': {       //分支机构图标
                        'icon': 'iconfont rounded icon-2fengongsi1'
                    },
                    'subCompanyContainer': {       //分支机构容器图标
                        'icon': 'iconfont rounded icon-2fengongsi1'
                    },
                    'company': {         //根节点图标
                        'icon': 'iconfont rounded icon-2fengongsi'
                    },
                    'depart': {
                        'icon': 'iconfont rounded icon-zuzhijiagou'
                    },
                    'root': {         //根节点图标
                        'icon': 'fa fa-building'
                    }
                }
            }).on('select_node.jstree', function (e, data) {

                var $selectedUser = $(that.element).find('#selectedOrgUsersList>div.col-md-12[data-id="'+data.node.original.id+'"]');
                if($selectedUser.length>0){

                    $selectedUser.find('a[data-action="delOrgUsers"]').click();

                }else{
                    if(that.settings.isSelectUser && data.node.original.type=='user')
                        that.selectClick(data.node.original);

                    if(!that.settings.isSelectUser)
                        that.selectClick(data.node.original);
                }

            }).on('ready.jstree', function (e, data) {//loaded.jstree

                that.traverseAddMark();
                var tree = $('#orgUsersTree').jstree(true);
                var node = tree.get_node(that._rootData.id);
                if(!tree.is_open(node)){
                    tree.open_node(node,function () {

                    });
                }

            }).on('load_node.jstree', function (e, data) {//load_node.jstree

            }).on('open_node.jstree', function (e, data) {//open_node.jstree

                that.traverseAddMark();

            }).on('close_node.jstree', function (e, data) {//close_node.jstree

            });
        }
        //节点点击事件
        ,selectClick:function (data) {
            var that = this;

            //追加右边展示框
            var iHtml = '<div class="col-md-12 m-t-xs m-b-xs" data-id="'+data.id+'" data-type="'+data.type+'">' +
                '<span class="pull-left">'+data.text+'</span>' +
                '<a href="javascript:void(0);" class="pull-right" data-action="delOrgUsers"><i class="fa fa-times fc-red"></i></a>' +
                '</div>';
            $(that.element).find('#selectedOrgUsersList').append(iHtml);

            //删除事件
            $(that.element).find('a[data-action="delOrgUsers"]:last').on('click',function () {
                $(this).closest('div.col-md-12').remove();
                var id = $(this).closest('div.col-md-12').attr('data-id');
                //树去已选标识
                $(that.element).find('li[id="'+id+'"]>a.jstree-anchor i.fa-check').remove();
            });

            //树加已选标识
            $(that.element).find('li[id="'+data.id+'"]>a.jstree-anchor').append('<i class="fa fa-check m-l-xs"></i>');
        }
        //添加标识
        ,traverseAddMark:function () {
            var that = this;
            $(that.element).find('#selectedOrgUsersList>div.col-md-12').each(function () {
                var id = $(this).attr('data-id');
                var $treeNode = $(that.element).find('li[id="'+id+'"]>a.jstree-anchor');
                if($treeNode.find('i.fa-check').length==0)
                    $(that.element).find('li[id="'+id+'"]>a.jstree-anchor').append('<i class="fa fa-check m-l-xs"></i>');
            });
        }
        //获取添加的组织或人员
        ,getSelectUsers:function () {
            var that = this;
            var selectedOrgUserList = [];
            $(that.element).find('#selectedOrgUsersList>div.col-md-12').each(function () {
                var id = $(this).attr('data-id');
                var type = $(this).attr('data-type');
                var text = $(this).find('span').text();
                selectedOrgUserList.push({id:id,text:text,type:type});
            });
            return selectedOrgUserList;
        }

        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'search':
                        //return ;//暂时未实现
                        var keyword = $(that.element).find('input[name="keyword"]').val();
                        if($.trim(keyword)==''){
                            $(that.element).find('#orgUserSearch').addClass('hide');
                            $(that.element).find('#orgUsersTree').removeClass('hide');
                        }else{

                            var html = template('m_org/m_select_org_users_search', {});
                            $(that.element).find('#orgUserSearch').html(html);
                            $(that.element).find('#orgUserSearch').removeClass('hide');
                            $(that.element).find('#orgUsersTree').addClass('hide');
                        }

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