/**
 * 选择组织
 * Created by wrb on 2018/6/28.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_org_chose_byTree",
        defaults = {
            type:0,//类型（选择不同URL）默认0=应收、应付、利润报表、收支类别设置的组织架构；1=费用录入的组织架构  不可进行点击,2=内部,3=发票的组织架构,4,6=审批设置,5=台账,7=项目收支明细-表四
            treeUrl:null,
            renderType:0,//默认0=浮窗展示,1=界面展示
            isCheck:false,//是否checkbox
            isRootDisabled:false,//是否根节点禁用
            isSelectExtendDataCompany:false,//是否默认选择extendData的company
            param:null,
            selectedCallBack:null,//选中回滚事件
            renderCallBack:null,//渲染完成事件
            selectedId:null,//选中某节点
            buttonStyle:null,//组件button样式
            spanStyle:null,//组件button>span样式
            isBtnFullWidth:false
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;
        this._selectedOrg = null;//当前选中的组织
        this._extendData = null;//请求返回的数据(extendData)
        this._selectedCompanyId = null;//当前选中组织
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            var option = {};
            if(that.settings.type==1){//总公司/分支机构/事业合伙人  不可进行点击

                option.url = restApi.url_getStaticCompanyForFinance;

            }else if(that.settings.type==2){//当前组织

                option.url = restApi.url_getOrgTreeForSearch;

            }else if(that.settings.type==3){

                option.url = restApi.url_getStaticCompanyForInvoice;

            }else if(that.settings.type==4){

                option.url = restApi.url_getAuditTemplateCompanyTree;

            }else if(that.settings.type==5){

                option.url = restApi.url_getStaticCompanyForCostDetail;

            }else if(that.settings.type==6){

                option.url = restApi.url_getAuditTemplateDepartTree+'/'+that.settings.param.companyId+'/'+that.settings.param.isSystem;

            }else if(that.settings.type==7){//需要禁用根节点和事业合伙人，分公司的盒子的

                option.url = restApi.url_getStaticCompanyTree2;

            }else if(that.settings.type==8){//整个组织架构树

                that._selectedCompanyId = that._currentCompanyId;
                option.url = restApi.url_getOrgStructureTree+'/'+that._currentCompanyId;

            }else{//节点没禁用

                option.url = restApi.url_getStaticCompanyTree;
            }
            var postFun = function (response) {
                if (response.code == '0') {

                    that._companyList = response.data;
                    that._extendData = response.extendData;
                    var html = template('m_org/m_org_chose_byTree',{
                        companyList:response.data,
                        renderType:that.settings.renderType,
                        buttonStyle:that.settings.buttonStyle,
                        spanStyle:that.settings.spanStyle,
                        isBtnFullWidth:that.settings.isBtnFullWidth
                    });
                    $(that.element).html(html);

                    that.renderOrgSelect();

                } else {
                    S_layer.error(response.info);
                }
            };
            if(that.settings.type==2 || that.settings.type==6 || that.settings.type==8){
                m_ajax.get(option, function (response) {
                    postFun(response);
                });
            }else{
                if(that.settings.param)
                    option.postData = that.settings.param;
                m_ajax.postJson(option, function (response) {
                    postFun(response);
                });
            }

        }
        , renderOrgSelect:function () {
            var that = this;
            var $tree = $(that.element).find('#orgTreeH');

            var plugins = ['types'];
            if(that.settings.isCheck)
                plugins = ['types', 'checkbox'];

            var jstree = $tree.jstree({
                'core': {
                    'check_callback': true,
                    'data': that._companyList
                },
                'plugins': plugins,//['types', 'checkbox']
                "checkbox": {
                    "keep_selected_style": false
                },
                'types': that.settings.treeIconObj || {
                    'default': {
                        'icon': 'iconfont rounded icon-zuzhijiagou'
                    },
                    'independent': {   //独立经营图标
                        'icon': 'fa fa-users'
                    },
                    'depart': {
                        'icon': 'iconfont rounded icon-zuzhijiagou'
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
                    'root': {         //根节点图标
                        'icon': 'iconfont rounded icon-2fengongsi'
                    }
                }
            }).on('after_open.jstree', function (e, data) {//load_node.jstree
                that.dealTreeIconColorFun(data.node.original.id);
                var tree = $tree.jstree(true);
                //禁用根节点选择
                if(that.settings.isRootDisabled==true)
                    tree.disable_node('#root');

            }).on('open_node.jstree', function (e, data) {//open_node.jstree

            }).on('close_node.jstree', function (e, data) {//close_node.jstree

            });


            if(that.settings.isCheck){
                jstree.bind('click.jstree', function (event) {

                    var ref = $tree.jstree(true);//获得整个树
                    var orgs = ref.get_selected(true);//获得所有选中节点，返回值为数组
                    var ids = ref.get_selected(false);//获得所有选中节点，返回值为数组
                    that._selectedOrgList = orgs;
                    that._selectedOrgIdsList = ids;

                    if(that.settings.selectedCallBack)
                        that.settings.selectedCallBack(that._selectedOrgList);

                }).on('ready.jstree', function (e, data) {//loaded.jstree

                    var tree = $tree.jstree(true);
                    tree.open_all();
                    tree.deselect_all();
                    if(that.settings.selectedId!=null && typeof that.settings.selectedId == 'object'){
                        $.each(that.settings.selectedId,function (i,item) {
                            var node = tree.get_node(item);
                            tree.check_node(node);
                        });
                    }else if(that.settings.selectedId!=null && typeof that.settings.selectedId == 'string'){
                        var node = tree.get_node(that.settings.selectedId);
                        tree.check_node(node);
                    }

                    if(that.settings.renderCallBack)
                        that.settings.renderCallBack(that._extendData);

                    //阻止浮窗关闭
                    $(that.element).find('#orgTreeH').on('click',function (e) {
                        e.stopPropagation();
                    });

                })

            }else{
                jstree.on('select_node.jstree', function (e, data) {

                    var tree = $tree.jstree(true);
                    that._selectedOrg = data.node.original;//获取当前树的对象
                    $(that.element).find('.company-name').html(that._selectedOrg.text);

                    //console.log(data)

                    //返回盒子子集不包括禁用
                    var childIdList = [];
                    if(data.node.original.childIdList!=null){

                        /*$.each(data.node.children_d,function (i,item) {
                            var node = tree.get_node(item);
                            if(node.state.disabled==false)
                                childIdList.push(node.id);
                        })*/
                        childIdList = data.node.original.childIdList;
                    }

                    if(that.settings.selectedCallBack)
                        that.settings.selectedCallBack(that._selectedOrg,childIdList,that._extendData);

                    $('.btn-group.m_org_chose_byTree').removeClass('open');//关闭浮窗

                }).on('ready.jstree', function (e, data) {//loaded.jstree

                    var tree = $tree.jstree(true);
                    tree.open_all();
                    tree.deselect_all();

                    if(that.settings.selectedId){

                        tree.select_node(that.settings.selectedId);

                    }else if(that.settings.isSelectExtendDataCompany && that._extendData && that._extendData.companyId){

                        tree.select_node(that._extendData.companyId);

                    }else if(!isNullOrBlank(that._selectedCompanyId)){

                        tree.select_node(that._selectedCompanyId);

                    }else{//默认选择根节点

                        var inst = data.instance;
                        var obj = inst.get_node(e.target.firstChild.firstChild.lastChild);
                        inst.select_node(obj);
                    }

                    if(that.settings.renderCallBack)
                        that.settings.renderCallBack(that._extendData);

                    //阻止浮窗关闭
                    $(that.element).find('#orgTreeH').on('click',function (e) {
                        e.stopPropagation();
                    });

                })
            }


        }
        //树icon颜色处理
        , dealTreeIconColorFun:function (id) {
            var that = this;
            var tree = $('#orgTreeH').jstree(true), sel = tree.get_node(id);
            if(sel && sel.children){
                $.each(sel.children,function (i,item) {

                    var selData = tree.get_node(item);
                    var $li = $('#orgTreeH').find('li#'+item);
                    if(selData.original.orgStatus=='1'){//离职状态
                        $li.css('color','#999').attr('title','已离职');
                        $li.find('a').eq(0).append('&nbsp;&nbsp;<span class="fa fa-info-circle" data-toggle="tooltip" data-container="body" data-original-title="解散于'+momentFormat(selData.updateDate,'YYYY/MM/DD')+'"></span>');
                        $li.find('[data-toggle="tooltip"]').tooltip({trigger:'hover'});
                    }
                    if(selData.original.relationType==1){
                        $li.find('a.jstree-anchor i.jstree-icon').addClass('color-blue');
                    }else if(selData.original.relationType==2){
                        $li.find('a.jstree-anchor i.jstree-icon').addClass('color-green');
                    }else if(selData.original.relationType==3){
                        $li.find('a.jstree-anchor i.jstree-icon').addClass('fc-red');
                    }

                });
            }
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
