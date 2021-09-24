/**
 * 生产安排-流程设置-选择工作流
 * Created by wrb on 2019/6/14.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_process_set_range",
        defaults = {
            isDialog:true,
            dataInfo:null,//流程ID,任务模板ID
            doType:1,//1=默认流程配置，2=任务模板配置
            isHadRole:true,
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID

        this._treeList = [];

        if(this.settings.doType==2)
            this.settings.title = '任务模板适用范围设置';


        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.getData(function () {
                var html = template('m_project_process/m_production_process_set_range',{
                    treeList:that._treeList
                });
                that.renderDialog(html,function () {

                    /*$(that.element).find('.tree-box').each(function () {
                        var $tree = $(this);
                        var i = $tree.closest('.row').attr('data-i');
                        var item = that._treeList[i];
                        that.initTree($tree,item.children);
                    });*/
                    that.initTree($(that.element).find('.tree-box'),that._treeList);
                    $(that.element).find('.row[data-i]').eq(0).find('.fa.fa-angle-down').removeClass('fa-angle-down').addClass('fa-angle-up');
                    $(that.element).find('.content').eq(0).removeClass('hide');
                    that.bindActionClick();

                });
            });

        },
        //初始化数据,生成html
        renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑


                var option = {
                    title: that.settings.title||'流程适用范围设置',
                    area : ['650px','500px'],
                    fixed:true,
                    //scrollbar:false,
                    content:html,
                    cancel:function () {
                    }

                }

                if(that.settings.isHadRole===true){
                    option.ok=function () {that.save();}
                }else{
                    option.cancelText = '关闭';
                }

                S_layer.dialog(option,function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack(layero,index,dialogEle);
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        ,getData:function (callBack) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_listProjectTemplateTree;
            option.postData = {};

            if(that.settings.doType==2){

                option.url = restApi.url_listProjectTaskTemplateTree;
                option.postData.id = that.settings.dataInfo.id;

            }else{
                option.postData.processId = that.settings.dataInfo.processId;
            }
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._treeList = response.data;
                    if(callBack)
                        callBack();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //生成树结构
        , initTree: function ($tree,orgData) {
            $tree.jstree({
                'core': {
                    'check_callback': true,
                    'data': orgData
                },
                'plugins': ['types', 'checkbox'],
                "checkbox": {
                    "keep_selected_style": false,
                    "cascade_to_disabled":false,
                    "three_state": true
                },
                'types': {
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
            }).bind('select_node.jstree', function (e, data) {

                console.log('select_node.jstree')

            }).bind('click.jstree', function (e) {

                var ref = $tree.jstree(true);//获得整个树
                var ids = ref.get_selected(false);//获得所有选中节点，返回值为数组
                //console.log(ids)


            }).bind('ready.jstree', function (e, data) {//loaded.jstree

                var tree = $tree.jstree(true);
                //tree.open_all();

            });
        }
        //请求数据
        ,save:function () {
            var that = this;

            var option = {};
            option.classId = 'body';
            option.url = restApi.url_saveProcessForProjectTemplate;
            option.postData = {};

            if(that.settings.doType==2){
                option.url = restApi.url_saveProjectTemplateTask;
                option.postData.id = that.settings.dataInfo.id;
            }else{
                option.postData.processId = that.settings.dataInfo.processId;
            }

            var templateIdList = [];
            $(that.element).find('.tree-box').each(function (i) {
                var $tree = $(this);
                var ref = $tree.jstree(true);//获得整个树
                var ids = ref.get_selected(false);//获得所有选中节点，返回值为数组

                //去掉disabled
                var newIds = [];
                $.each(ids,function (i,item) {
                    var itemNode = ref.get_node("#"+item);
                    if(!ref.is_disabled(itemNode)){
                        newIds.push(item);
                    }
                });
                templateIdList = templateIdList.concat(newIds);
            });

            option.postData.templateIdList = templateIdList;


            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    S_toastr.success('操作成功！');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').off('click').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');

                switch (dataAction){
                    case 'expand'://展开与否

                        if($this.find('i').hasClass('fa-angle-down')){
                            $this.closest('.row').find('.content').removeClass('hide');
                            $this.find('i').removeClass('fa-angle-down').addClass('fa-angle-up');
                        }else{
                            $this.closest('.row').find('.content').addClass('hide');
                            $this.find('i').addClass('fa-angle-down').removeClass('fa-angle-up');
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
