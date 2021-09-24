/**
 * 项目模板－选择模板
 * Created by wrb on 2019/11/20.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_task_temp_edit",
        defaults = {
            title:null,
            isDialog:true,
            fieldItems:null,//fieldItems不为null,即编辑
            saveParam:null,//保存另外参数
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;
        this._currentUserId = window.currentUserId;

        this._selectedItemList = [];//选择列表
        this._customItemList = [];//自定义列表

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
                    title: that.settings.title||'从模版中选择',
                    area : '1000px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        that.save();

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
            var html = template('m_project_temp/m_project_task_temp_edit', {});
            that.renderDialog(html, function () {

                if (that.settings.fieldItems) {
                    $.each(that.settings.fieldItems, function (i, item) {

                        that._selectedItemList.push({
                            fieldName: item.fieldName,
                            id:item.id,
                            relationId:item.relationId
                        });

                    });
                    that.renderSelectedItemList();
                }

                that.initICheck();
                that.initSelect2();
                that.addProperty_validate();
                that.bindActionClick();

            });
        }
        //渲染标签库
        ,renderTaskTempList:function (id) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_listTaskTemplateByMainId;
            option.postData = {
                id:id
            };
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var html = template('m_project_temp/m_project_task_temp_edit_library', {dataList:response.data});
                    $(that.element).find('#libraryBox').html(html);
                    that.initICheck();
                    that.checkedItem();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染select2
        ,initSelect2:function () {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_listTaskTemplate;
            option.postData = {};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var data = [];

                    if(response.data && response.data.length>0){
                        $.each(response.data,function (i,item) {
                            data.push({id:item.id,text:item.templateName});
                        });
                    }
                    var selectOpt = {
                        tags:false,
                        allowClear: false,
                        containerCssClass:'select-sm w-100',
                        minimumResultsForSearch: -1,
                        language: "zh-CN",
                        width:'100%',
                        data:data
                    };
                    var $select2 = $(that.element).find('select[name="selectTemp"]').select2(selectOpt);
                    $select2.on('change', function (e) {
                        var id = $(this).val();
                        that.renderTaskTempList(id);
                    });

                    if(data && data.length>0)
                        $(that.element).find('select[name="selectTemp"]').val(data[0].id).trigger('change');

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染选择
        ,renderSelectedItemList:function () {
            var that = this;

            var html = template('m_project_temp/m_project_temp_edit_select',{
                selectedItemList: that._selectedItemList,
                type:that.settings.type
            });
            $(that.element).find('#selectItemBox').html(html);
            that.bindSortable();
            $(that.element).find('[data-toggle="tooltip"]').tooltip({trigger:'hover'});

            //删除已选
            $(that.element).find('#selectItemBox').find('a[data-action="delSelectedItem"]').on('click',function () {
                var fieldName = $(this).prev('.field-name').attr('data-field-name');

                var $item = $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]');

                if($item.length>0 && $item.is(':checked')){
                    $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').iCheck('uncheck');
                }else{

                    delObjectInArray(that._selectedItemList,function (obj) {
                        return obj.fieldName == fieldName;
                    });
                    $(this).closest('.list-group-item').remove();
                }
            });

        }
        //绑定checkbox显示
        ,initICheck:function($ele){
            var that = this;
            if($ele==null)
                $ele = $(that.element);

            $ele.find('.i-checks').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            });

            $ele.find('input[name="itemCk"]').on('ifChecked', function(e){

                var fieldName = $(this).val();
                var itemId = $(this).attr('data-id');
                var relationId = $(this).attr('data-relation-id');

                //没有选择，才处理
                if($(that.element).find('#selectItemBox .list-group-item .field-name[data-field-name="'+fieldName+'"]').length==0){
                    that._selectedItemList.push({
                        fieldName:fieldName,
                        id:itemId,
                        relationId:relationId
                    });
                    that.renderSelectedItemList();
                }

                that.checkItemAll();
                return false;

            }).on('ifUnchecked', function(e){

                var fieldName = $(this).val();
                //有选择，才处理
                if($(that.element).find('#selectItemBox .list-group-item .field-name[data-field-name="'+fieldName+'"]').length>0){
                    delObjectInArray(that._selectedItemList,function (obj) {
                        return obj.fieldName == fieldName;
                    });
                    that.renderSelectedItemList();
                }
                that.checkItemAll();
                return false;
            });

            $ele.find('input[name="allItemCK"]').on('ifChecked', function(e){

                $(that.element).find('input[name="itemCk"]').iCheck('check');
                return false;

            }).on('ifUnchecked', function(e){

                $(that.element).find('input[name="itemCk"]').iCheck('uncheck');
                return false;
            });

        }
        //全选判断
        ,checkItemAll:function () {
            var that = this;
            var itemLen = $(that.element).find('input[name="itemCk"]').length;
            var itemCheckLen = $(that.element).find('input[name="itemCk"]:checked').length;
            if(itemLen==itemCheckLen){
                $(that.element).find('input[name="allItemCK"]').prop('checked',true);
                $(that.element).find('input[name="allItemCK"]').iCheck('update');
            }else{
                $(that.element).find('input[name="allItemCK"]').prop('checked',false);
                $(that.element).find('input[name="allItemCK"]').iCheck('update');
            }
        }
        //已选的进行checked
        ,checkedItem:function () {
            var that = this;
            //已选匹配checkbox选中
            $(that.element).find('#selectItemBox .field-name').each(function () {
                var fieldName = $(this).attr('data-field-name');
                $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').prop('checked',true);
                $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').iCheck('update');
            });
            that.checkItemAll();
        }
        //渲染自定义
        ,renderCusItemList:function () {
            var that = this;

            var html = template('m_project_temp/m_project_temp_edit_customize',{
                customItemList: that._customItemList,
                type:that.settings.type
            });
            $(that.element).find('#customItemBox').html(html);
            that.initICheck($(that.element).find('#customItemBox'));
            $(that.element).find('[data-toggle="tooltip"]').tooltip({trigger:'hover'});

            //删除已加
            $(that.element).find('#customItemBox').find('a[data-action="delCusItem"]').on('click',function () {
                var fieldName = $(this).closest('.i-checks').find('input[name="cusItemCk"]').val();
                $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').iCheck('uncheck');
                delObjectInArray(that._customItemList,function (obj) {
                    return obj.fieldName == fieldName;
                });
                $(this).closest('.col-md-6').remove();
            });

        }
        //已选自定义属性排序拖拽
        ,bindSortable: function () {
            var that = this;
            var sortable = Sortable.create(document.getElementById('selectItemBox'), {
                animation: 200,
                handle: '.item-span',
                sort: true,
                dataIdAttr: 'data-sortId',
                ghostClass: 'my-sortable-ghost',
                chosenClass: 'my-sortable-chosen',
                dragClass: 'my-sortable-drag',
                onEnd: function(evt){ //拖拽完毕之后发生该事件
                    //console.log('onEnd.foo:', [evt.item, evt.from]);
                    //console.log(evt)
                }
            });
        }
        //保存
        ,save:function () {
            var that = this;
            var dataList = [];
            $(that.element).find('#selectItemBox .item-span .field-name').each(function (i) {

                var data = {};
                data.fieldName = $(this).attr('data-field-name');
                data.relationId = $(this).attr('data-relation-id');
                dataList.push(data);

            });

            if(that.settings.saveCallBack)
                that.settings.saveCallBack(dataList);
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');

                switch (dataAction){
                    case 'addItem'://添加自定义

                        if($(that.element).find('form#addItemForm').valid()){

                            var fieldName = $(this).parents('.row').find('input[name="fieldName"]').val();

                            that._customItemList.push({
                                fieldName:fieldName
                            });
                            that.renderCusItemList();

                            that._selectedItemList.push({
                                fieldName:fieldName
                            });
                            that.renderSelectedItemList();
                            $(this).parents('.row').find('input[name="fieldName"]').val('');
                        }

                        //已选匹配checkbox选中
                        $(that.element).find('#selectItemBox .field-name').each(function () {
                            var fieldName = $(this).attr('data-field-name');
                            $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').prop('checked',true);
                            $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').iCheck('update');
                        });
                        break;
                }

            });
        }
        //添加自定义属性验证
        ,addProperty_validate: function () {
            var that = this;
            $('form#addItemForm').validate({
                rules: {
                    fieldName: {
                        required: true,
                        isReName: true
                    }
                },
                messages: {
                    fieldName: {
                        required: '名称不可为空！',
                        isReName: "该名称已存在选择列表，请勿重复添加"

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

                if($(that.element).find('#selectItemBox span.field-name[data-field-name="'+value+'"]').length>0){
                    isOk = false;
                }
                return  isOk;

            }, "该名称已存在，请勿重复添加");

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


