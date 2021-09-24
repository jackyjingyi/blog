/**
 * 批量添加
 * Created by wrb on 2017/08/15.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_issue_add_mult",
        defaults = {
            title:null,
            isDialog:true,
            projectId:null,
            type:1,//1=签发，2=生产
            taskInfo:null,//{任务ID,计划时间(startTime,endTime),personInChargeInfo=任务负责人}
            projectTempData:null,//模板数据(设计阶段 stageDesignList,专业数据 majorDesignList)
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

        this._stageDesignList = this.settings.projectTempData.stageDesignList;//设计阶段
        this._majorDesignList = this.settings.projectTempData.majorDesignList;//专业数据

        this._copyStageDesignList = $.extend(true, [], this._stageDesignList);//设计阶段
        this._copyMajorDesignList = $.extend(true, [], this._majorDesignList);//专业数据


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
            var html = template('m_task_issue/m_task_issue_add_mult',{stageDesignList:that._stageDesignList});
            that.renderDialog(html,function () {
                that.initDesignPhaseCk();
                that.addCusItem_validate($(that.element).find('.design-phase form'));
                $(that.element).find('input[name="designPhaseCk"]').eq(0).parents('.i-checks').click();

                that.renderMajorDesign();
            });

        }
        //渲染专业
        ,renderMajorDesign:function () {
            var that = this;
            var html = template('m_task_issue/m_task_issue_add_mult_profession',{dataList:that._majorDesignList});
            $(that.element).find('.design-profession').html(html);

            if(that._copyMajorDesignList){
                $.each(that._copyMajorDesignList,function (i,item) {
                    if(item.isCustom==1){
                        that.renderCusItemAdd(item,2);
                    }
                });
            }

            that.initItemICheck();
            that.addCusItem();
            that.addCusItem_validate($(that.element).find('.design-profession form'));
        }
        //初始化icheck
        ,initDesignPhaseCk:function ($ele) {
            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element);

            var ifClicked = function (e) {
                var dataId = $(this).val();

                //渲染选中
                $(that.element).find('input[name="itemCk"]').prop('checked',false);
                $(that.element).find('input[name="itemCk"]').iCheck('update');
                $(that.element).find('#selectedItemBox .list-group-item[data-design-id="'+dataId+'"]').each(function () {
                    var itemId = $(this).attr('data-id');
                    $(that.element).find('input[name="itemCk"][value="'+itemId+'"]').prop('checked',true);
                    $(that.element).find('input[name="itemCk"][value="'+itemId+'"]').iCheck('update');
                });
                //判断是否全选
                that.checkItemAll();


            };
            $ele.find('input[name="designPhaseCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifClicked.s', ifClicked);
        }
        //初始化icheck
        ,initItemICheck:function ($ele) {
            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element);

            var ifChecked = function (e) {
                var id = $(this).val();
                if(isNullOrBlank(id)){//全选
                    $(that.element).find('.design-profession .temp-item-box input[name="itemCk"]').iCheck('check');
                }else{
                    that.checkedItem($(this));
                }
                that.checkItemAll();
            };
            var ifUnchecked = function (e) {

                var id = $(this).val();
                if(isNullOrBlank(id)){//全选
                    $(that.element).find('.design-profession .temp-item-box input[name="itemCk"]').iCheck('uncheck');
                }else{
                    that.unCheckedItem(id);
                }
                that.checkItemAll();
            };
            $ele.find('input[name="itemCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);
        }
        //判断是否全选
        ,checkItemAll:function () {
            var that = this;
            var itemLen =  $(that.element).find('input[name="itemCk"][value!=""]').length;
            var itemCheckLen =  $(that.element).find('input[name="itemCk"][value!=""]:checked').length;
            if(itemLen==itemCheckLen){
                $(that.element).find('input[name="itemCk"][value=""]').prop('checked',true);
                $(that.element).find('input[name="itemCk"][value=""]').iCheck('update');
            }else{
                $(that.element).find('input[name="itemCk"][value=""]').prop('checked',false);
                $(that.element).find('input[name="itemCk"][value=""]').iCheck('update');
            }
        }
        ,checkedItem:function ($this) {
            var that  =this;

            var data = {
                name:$this.attr('data-name'),
                designName:$(that.element).find('input[name="designPhaseCk"]:checked').attr('data-name'),
                designId:$(that.element).find('input[name="designPhaseCk"]:checked').val(),
                designIsCustom:$(that.element).find('input[name="designPhaseCk"]:checked').attr('data-is-custom'),
                id:$this.val(),
                isCustom:$this.attr('data-is-custom')
            };
            that.renderSelectedItemAdd(data);

        }
        ,unCheckedItem:function (id) {
            var that = this;
            var designPhase = $(that.element).find('input[name="designPhaseCk"]:checked').val();
            $(that.element).find('#selectedItemBox .list-group-item[data-design-id="'+designPhase+'"][data-id="'+id+'"]').remove();
        }
        //添加到右边并渲染
        ,renderSelectedItemAdd:function (data) {
            var that = this;
            var html = template('m_task_issue/m_task_issue_add_mult_select',data);
            $(that.element).find('#selectedItemBox').append(html);
            var $item = $(that.element).find('#selectedItemBox .list-group-item:last');
            $item.find('span[data-toggle="tooltip"]').tooltip();
            //删除事件绑定
            $item.find('a[data-action="delSelectedItem"]').on('click',function (e) {
                var $this = $(this);
                var id = $(this).attr('data-id'),designId = $(this).attr('data-design-id');
                var designPhase = $(that.element).find('input[name="designPhaseCk"]:checked').val();
                var $input = $(that.element).find('input[name="itemCk"][value="'+id+'"]');
                if($input.length>0 && designPhase==designId){
                    $(that.element).find('input[name="itemCk"][value="'+id+'"]').iCheck('uncheck');
                }else{

                    $this.closest('.list-group-item').remove();
                }

                e.stopPropagation();
            });
            that.bindSortable();
        }
        //添加自定义
        ,addCusItem:function () {
            var that = this;
            $(that.element).find('button[data-action="addItemBtn"]').on('click',function () {

                var $this = $(this),type = $this.attr('data-type');

                if($this.closest('.addItemForm').valid()){
                    var itemName = $(this).parents('.row').find('input[name="itemName"]').val();
                    var designPhase = $(that.element).find('input[name="designPhaseCk"]:checked').val();
                    var key = UUID.genV4().hexNoDelim;
                    var data = {
                        name:itemName,
                        id:key,//生成key
                        isCustom:1
                    };
                    if(type==1){

                        that._copyStageDesignList.push(data);

                    }else{
                        that._copyMajorDesignList.push(data);
                    }

                    that.renderCusItemAdd(data,type);
                    //清空
                    $(this).parents('.row').find('input[name="itemName"]').val('');
                }
            });
        }
        //渲染自定义
        ,renderCusItemAdd:function (data,type) {
            var that = this;
            data.type = type;
            var html = template('m_task_issue/m_task_issue_add_mult_item',data);
            var $panel = $(that.element).find('.design-phase');
            if(type==2)
                $panel = $(that.element).find('.design-profession');

            $panel.find('.cus-item-box').append(html);
            var $item = $panel.find('.cus-item-box .i-checks:last');


            $item.find('span[data-toggle="tooltip"]').tooltip();

            if(type==1){
                that.initDesignPhaseCk($item);
            }else{
                that.initItemICheck($item);
                $item.find('input[name="itemCk"]').iCheck('check');
            }

            //删除事件绑定
            $item.find('a[data-action="delCusItem"]').on('click',function (e) {
                var itemId = $(this).attr('data-id');
                var type = $(this).closest('.design-phase').length==1?1:2;

                var $check = $(this).closest('.i-checks').find('input');

                if(type==1){

                    $(that.element).find('#selectedItemBox .list-group-item[data-design-id="'+itemId+'"]').remove();
                    delObjectInArray(that._copyStageDesignList,function (obj) {
                        return obj.id == itemId;
                    });
                    if($check.is(':checked')){
                        $(that.element).find('input[name="designPhaseCk"]').eq(0).parents('.i-checks').click();
                    }

                }else{

                    $(that.element).find('#selectedItemBox .list-group-item[data-id="'+itemId+'"]').remove();
                    delObjectInArray(that._copyMajorDesignList,function (obj) {
                        return obj.id == itemId;
                    });
                }
                $(this).closest('.col-sm-4').remove();
                e.stopPropagation();
            });
        }
        //添加自定义属性验证
        ,addCusItem_validate: function ($ele) {
            var that = this;
            if($ele==null)
                $ele = $(that.element);

            $ele.validate({
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
                var type = $(element).closest('.design-phase').length==1?1:2;

                if(type==1 && that._copyStageDesignList!=null && that._copyStageDesignList.length>0){
                    $.each(that._copyStageDesignList,function (i,item) {
                        if(value == item.name){
                            isOk = false;
                            return false;
                        }
                    });

                }else{
                    $.each(that._copyMajorDesignList,function (i,item) {
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

            if(that.settings.type==1)
                options.url = restApi.url_saveOrderTaskList;

            options.async = false;
            options.postData = {taskList:[]};

            $(that.element).find('#selectedItemBox .list-group-item').each(function (i) {
                var data = {};

                var $this = $(this);
                data.designName = $this.attr('data-design-name');
                data.majorName = $this.attr('data-name');
                data.projectId = that.settings.projectId;
                data.taskType = that.settings.type==1?2:0;
                data.companyId = that._currentCompanyId;

                if(that.settings.taskInfo && that.settings.taskInfo.taskId!=null)
                    data.taskPid = that.settings.taskInfo.taskId;

                if($this.attr('data-is-custom')=='0')
                    data.majorId = $this.attr('data-id');

                if($this.attr('data-design-is-custom')=='0')
                    data.designId = $this.attr('data-design-id');

                if(that.settings.taskInfo && !isNullOrBlank(that.settings.taskInfo.startTime))
                    data.startTime = that.settings.taskInfo.startTime;

                if(that.settings.taskInfo && !isNullOrBlank(that.settings.taskInfo.endTime))
                    data.endTime = that.settings.taskInfo.endTime;

                /*if(that.settings.type==2 && that.settings.taskInfo && that.settings.taskInfo.personInChargeInfo){
                    data.taskType = 0;
                    data.designerId = that.settings.taskInfo.personInChargeInfo.personInChargeId;
                }*/

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


