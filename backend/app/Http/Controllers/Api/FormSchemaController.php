<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FormSchema;
use Illuminate\Http\Request;

class FormSchemaController extends Controller
{
    public function index()
    {
        return response()->json(FormSchema::all());
    }

    public function active()
    {
        return response()->json(FormSchema::where('is_active', true)->first());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'fields' => 'required|array',
            'fields.*.name' => 'required|string',
            'fields.*.label' => 'required|string',
            'fields.*.type' => 'required|in:text,textarea,number,email,date,dropdown,radio,checkbox,address',
            'fields.*.required' => 'required|boolean',
            'fields.*.options' => 'nullable|array',
        ]);

        $schema = FormSchema::create($validated);
        return response()->json($schema, 201);
    }

    public function update(Request $request, FormSchema $formSchema)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'fields' => 'sometimes|array',
            'is_active' => 'sometimes|boolean',
        ]);

        $formSchema->update($validated);
        return response()->json($formSchema);
    }

    public function destroy(FormSchema $formSchema)
    {
        $formSchema->delete();
        return response()->json(['message' => 'Form schema dihapus']);
    }
}