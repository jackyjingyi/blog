/**
 * 基本信息－自定义属性模板
 * Created by wrb on 2017/08/15.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_add_mult",
        defaults = {
            title:null,
            isDialog:true,
            projectId:null,
            type:1,//1=签发，2=生产
            taskInfo:null,//当前任务
            dataPidItem:null,//父任务
            taskRelationId:null,//
            majorDesignRelationId:null,
            stageDesignRelationId:null,
            functionTypeRelationId:null,
            okCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;
        this._currentUserId = window.currentUserId;

        this._tempItemList = this.settings.taskOptionList;//数据字典
        this._cusItemList = [];//自定义数据字典
        this._selectedItemList = [];//选择的数据
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderPage();
        },
        //初始化数据
        renderDialog:function (html,callBack) {
            var that = this;

            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'批量添加任务订单',
                    area : '1000px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var errorTip = '请选择模板标签库或自定义录入';
                        if(that.settings.taskOptionList==null)
                            errorTip = '请自定义录入';

                        if($(that.element).find('#selectedItemBox .list-group-item').length==0){
                            S_toastr.error(errorTip);
                            return false;
                        }
                        if(that.save()){
                            return false;
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
        //生成html
        ,renderPage:function () {
            var that = this;
            that.getTaskOption(function (data) {
                var html = template('m_production/m_production_add_mult',{tempItemList:data});
                that.renderDialog(html,function () {
                    that.initItemICheck();
                    that.addCusItem();
                    that.addCusItem_validate();
                });
            });
        }
        //获取设计阶段，专业数据
        ,getTaskOption:function (callBack) {
            var that=this;
            var option={};
            option.classId = that.element;
            option.url=restApi.url_listTaskTemplateOption;
            option.postData = {
                projectId:that.settings.projectId,
                functionTypeRelationId:that.settings.functionTypeRelationId,
                stageDesignRelationId:that.settings.stageDesignRelationId,
                majorDesignRelationId:that.settings.majorDesignRelationId
            };
            option.postData = filterParam(option.postData);
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    that._tempItemList = response.data.taskDesignList;
                    if(callBack)
                        callBack(that._tempItemList);
                }else {
                    S_layer.error(response.info);
                }
            });
        }
        //初始化icheck
        ,initItemICheck:function ($ele) {
            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element);

            var ifChecked = function (e) {
                var id = $(this).val();
                if(isNullOrBlank(id)){//全选
                    $(that.element).find('#tempItemBox input[name="itemCk"]').iCheck('check');
                }else{
                    that.checkedItem($(this));
                }
            };
            var ifUnchecked = function (e) {

                var id = $(this).val();
                if(isNullOrBlank(id)){//全选
                    $(that.element).find('#tempItemBox input[name="itemCk"]').iCheck('uncheck');
                }else{
                    that.unCheckedItem(id);
                }
            };
            $ele.find('input[name="itemCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);
        }
        ,checkedItem:function ($this) {
            var that  =this;
            var data = {
                name:$this.attr('data-name'),
                id:$this.val(),
                isCustom:$this.attr('data-is-custom')
            };
            that._selectedItemList.push(data);
            that.renderSelectedItemAdd(data);
        }
        ,unCheckedItem:function (id) {
            var that = this;
            delObjectInArray(that._selectedItemList,function (obj) {
                return obj.id == id;
            });
            $(that.element).find('#selectedItemBox .list-group-item[data-id="'+id+'"]').remove();
        }
        //添加到右边并渲染
        ,renderSelectedItemAdd:function (data) {
            var that = this;
            var html = template('m_production/m_production_add_mult_select',data);
            $(that.element).find('#selectedItemBox').append(html);
            var $item = $(that.element).find('#selectedItemBox .list-group-item:last');
            $item.find('span[data-toggle="tooltip"]').tooltip();
            //删除事件绑定
            $item.find('a[data-action="delSelectedItem"]').on('click',function (e) {
                var id = $(this).attr('data-id');
                /*$(this).closest('.list-group-item').remove();
                delObjectInArray(that._selectedItemList,function (obj) {
                    return obj.id == id;
                });*/
                $(that.element).find('input[name="itemCk"][value="'+id+'"]').iCheck('uncheck');
                e.stopPropagation();
            });
            that.bindSortable();
        }
        //添加自定义
        ,addCusItem:function () {
            var that = this;
            $(that.element).find('button[data-action="addItemBtn"]').on('click',function () {

                if($('form.addItemForm').valid()){
                    var itemName = $(this).parents('.row').find('input[name="itemName"]').val();
                    var data = {
                        name:itemName,
                        id:UUID.genV4().hexNoDelim,//生成key
                        isCustom:1
                    };
                    that._cusItemList.push(data);
                    that.renderCusItemAdd(data);

                    //清空
                    $(this).parents('.row').find('input[name="itemName"]').val('');
                }
            });
        }
        //渲染自定义
        ,renderCusItemAdd:function (data) {
            var that = this;
            var html = template('m_production/m_production_add_mult_item',data);
            $(that.element).find('#customItemBox').append(html);
            var $item = $(that.element).find('#customItemBox .i-checks:last');
            that.initItemICheck($item);
            $item.find('span[data-toggle="tooltip"]').tooltip();
            $item.find('input[name="itemCk"]').iCheck('check');
            //删除事件绑定
            $item.find('a[data-action="delCusItem"]').on('click',function (e) {
                var id = $(this).attr('data-id');
                $(that.element).find('input[name="itemCk"][value="'+id+'"]').iCheck('uncheck');
                delObjectInArray(that._cusItemList,function (obj) {
                    return obj.id == id;
                });
                $(this).closest('.col-md-6').remove();
                e.stopPropagation();
            });
        }
        //添加自定义属性验证
        ,addCusItem_validate: function () {
            var that = this;
            $('form.addItemForm').validate({
                rules: {
                    itemName: {
                        required: true,
                        isReName: true
                    }
                },
                messages: {
                    itemName: {
                        required: '名称不可为空！',
                        isReName: "该名称已存在，请勿重复添加"

                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    element.closest('.row').find('.col-md-12').html(error);
                }
            });
            // 重名验证
            jQuery.validator.addMethod("isReName", function (value, element) {
                value = $.trim(value);
                var isOk = true;
                if(that._tempItemList!=null && that._tempItemList.length>0){
                    $.each(that._tempItemList,function (i,item) {
                        if(value == item.name){
                            isOk = false;
                            return false;
                        }
                    });
                }
                if(isOk && that._cusItemList!=null && that._cusItemList.length>0){
                    $.each(that._cusItemList,function (i,item) {
                        if(value == item.name){
                            isOk = false;
                            return false;
                        }
                    });
                }
                return  isOk;

            }, "该名称已存在，请勿重复添加");

        }
        //已选自定义属性排序拖拽
        ,bindSortable: function () {
            var that = this;
            var sortable = Sortable.create(document.getElementById('selectedItemBox'), {
                animation: 200,
                handle: '.list-group-item',
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
                    //that._selectedItemList = sortList(evt.oldIndex,evt.newIndex,that._selectedItemList);
                }
            });
            //Sortable.create(selectedFieldBox, { /* options */ });
        }
        //保存签发
        ,save:function () {
            var options={},that=this,isError = false;

            options.classId = 'body';
            options.url=restApi.url_saveTaskIssuingList;
            options.async = false;
            options.postData = {taskList:[]};

            $(that.element).find('#selectedItemBox .list-group-item').each(function (i) {
                var data = {};

                var $this = $(this);
                data.taskName = $this.attr('data-name');
                data.projectId = that.settings.projectId;
                data.taskType = that.settings.type==1?2:0;
                data.companyId = that._currentCompanyId;

                if(that.settings.dataPidItem && that.settings.dataPidItem.id!=null)
                    data.taskPid = that.settings.dataPidItem.id;

                if($this.attr('data-is-custom')=='0')
                    data.taskRelationId = $this.attr('data-id');

                if(that.settings.taskInfo && !isNullOrBlank(that.settings.taskInfo.startTime))
                    data.startTime = that.settings.taskInfo.startTime;

                if(that.settings.taskInfo && !isNullOrBlank(that.settings.taskInfo.endTime))
                    data.endTime = that.settings.taskInfo.endTime;

                options.postData.taskList.push(data);

            });
            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack(response.data);
                }else {
                    if(response.info.indexOf('已存在')>-1){
                        S_toastr.error(response.info+'任务订单');
                        isError = true;
                    }else{
                        S_layer.error(response.info);
                    }
                }
            });
            return isError;
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


